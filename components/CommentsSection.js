//Components/CommentsSection.js//

import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useUserData } from "../contexts/UserDataContext";
import {
  CommentSort,
  COMMENTS_PAGE_SIZE,
  MAX_THREAD_DEPTH,
  addComment,
  fetchComments,
  flagComment,
  voteOnComment,
} from "../utils/comments";

const SORT_OPTIONS = [
  { label: "Newest", value: CommentSort.NEWEST },
  { label: "Oldest", value: CommentSort.OLDEST },
  { label: "Top", value: CommentSort.TOP },
];

const DEFAULT_PALETTE = {
  background: "#fff",
  surface: "#fff",
  border: "#E5E7EB",
  textPrimary: "#0F172A",
  textSecondary: "#6B7280",
  accent: "#2563EB",
  muted: "#94A3B8",
  danger: "#DC2626",
};

function formatRelativeTime(timestamp) {
  if (!timestamp) return "Just now";
  const diff = Date.now() - timestamp;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return "Just now";
  if (diff < hour) {
    const mins = Math.floor(diff / minute);
    return `${mins}m ago`;
  }
  if (diff < day) {
    const hrs = Math.floor(diff / hour);
    return `${hrs}h ago`;
  }
  const days = Math.floor(diff / day);
  return `${days}d ago`;
}

const buildThread = (comments) => {
  if (!Array.isArray(comments)) return [];

  const map = new Map();
  comments.forEach((comment) => {
    map.set(comment.id, { ...comment, children: [] });
  });

  const roots = [];
  map.forEach((comment) => {
    if (comment.parentId && map.has(comment.parentId)) {
      map.get(comment.parentId).children.push(comment);
    } else {
      roots.push(comment);
    }
  });

  const ordered = [];
  const walk = (nodes, depth = 0) => {
    nodes.forEach((node) => {
      const nextDepth =
        typeof node.depth === "number" ? node.depth : depth;
      ordered.push({ ...node, depth: nextDepth });
      if (node.children?.length) {
        walk(node.children, Math.min(MAX_THREAD_DEPTH, nextDepth + 1));
      }
    });
  };

  walk(roots);
  return ordered;
};

const appendUniqueComments = (existing, incoming) => {
  if (!Array.isArray(incoming) || incoming.length === 0) return existing;
  const seen = new Set(existing.map((c) => c.id));
  const merged = [...existing];
  incoming.forEach((comment) => {
    if (!seen.has(comment.id)) {
      merged.push(comment);
      seen.add(comment.id);
    }
  });
  return merged;
};

function CommentRow({ comment, palette, onReply, onVote, onFlag }) {
  const indent = Math.min(MAX_THREAD_DEPTH, comment.depth || 0) * 16;
  const score = (comment.upvotes || 0) - (comment.downvotes || 0);

  return (
    <View
      style={[
        styles.commentRow,
        { marginLeft: indent, borderBottomColor: palette.border },
      ]}
    >
      <View style={styles.commentHeader}>
        <Text style={[styles.commentAuthor, { color: palette.textPrimary }]}>
          {comment.authorName || "Reader"}
        </Text>
        <Text style={[styles.commentMeta, { color: palette.textSecondary }]}>
          {formatRelativeTime(comment.createdAt)} · {score} pts
        </Text>
      </View>

      <Text style={[styles.commentBody, { color: palette.textPrimary }]}>
        {comment.text}
      </Text>

      <View style={styles.commentActions}>
        <TouchableOpacity onPress={() => onVote(comment, 1)}>
          <Text style={[styles.actionText, { color: palette.accent }]}>
            ▲ Upvote
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onVote(comment, -1)}>
          <Text style={[styles.actionText, { color: palette.accent }]}>
            ▼ Downvote
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onReply(comment)}>
          <Text style={[styles.actionText, { color: palette.textSecondary }]}>
            Reply
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onFlag(comment)}>
          <Text style={[styles.actionText, { color: palette.danger }]}>
            Flag
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function CommentsSection({ type, itemId }) {
  const { user, themeColors } = useUserData();
  const palette = themeColors || DEFAULT_PALETTE;

  const [sort, setSort] = useState(CommentSort.NEWEST);
  const [rawComments, setRawComments] = useState([]);
  const [replyTarget, setReplyTarget] = useState(null);
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState(null);
  const [error, setError] = useState(null);
  const [refreshNonce, setRefreshNonce] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const loadInitial = async () => {
      setInitialLoading(true);
      setError(null);
      try {
        const { comments, lastVisible } = await fetchComments({
          type,
          itemId,
          sort,
          cursor: null,
        });
        if (!isMounted) return;
        setRawComments(comments);
        setCursor(lastVisible);
        setHasMore(Boolean(lastVisible));
      } catch (err) {
        if (!isMounted) return;
        setError("Failed to load comments.");
      } finally {
        if (isMounted) setInitialLoading(false);
      }
    };

    loadInitial();
    return () => {
      isMounted = false;
    };
  }, [type, itemId, sort, refreshNonce]);

  const thread = useMemo(() => buildThread(rawComments), [rawComments]);

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    setError(null);
    try {
      const { comments, lastVisible } = await fetchComments({
        type,
        itemId,
        sort,
        cursor,
      });
      setRawComments((prev) => appendUniqueComments(prev, comments));
      setCursor(lastVisible);
      setHasMore(Boolean(lastVisible));
    } catch (err) {
      setError("Failed to load comments.");
    } finally {
      setLoadingMore(false);
    }
  };

  const ensureAuthed = () => {
    if (!user) {
      alert("Sign in to join the discussion.");
      return false;
    }
    return true;
  };

  const resetComposer = () => {
    setText("");
    setReplyTarget(null);
  };

  const handleSubmit = async () => {
    if (!ensureAuthed()) return;
    const trimmed = text.trim();
    if (!trimmed) return;
    if (trimmed.length > 2000) {
      alert("Comments must be under 2000 characters.");
      return;
    }
    try {
      setPosting(true);
      await addComment({
        type,
        itemId,
        text: trimmed,
        parentId: replyTarget?.id || null,
        user,
      });
      resetComposer();
      setRefreshNonce((val) => val + 1);
    } catch (err) {
      alert("Failed to post comment. Please try again.");
    } finally {
      setPosting(false);
    }
  };

  const handleVote = async (comment, delta) => {
    if (!ensureAuthed()) return;
    try {
      await voteOnComment({
        type,
        itemId,
        commentId: comment.id,
        delta,
      });
      setRawComments((prev) =>
        prev.map((c) => {
          if (c.id !== comment.id) return c;
          if (delta > 0) {
            return { ...c, upvotes: (c.upvotes || 0) + 1 };
          }
          if (delta < 0) {
            return { ...c, downvotes: (c.downvotes || 0) + 1 };
          }
          return c;
        })
      );
    } catch (err) {
      alert("Unable to register vote.");
    }
  };

  const handleFlag = async (comment) => {
    if (!ensureAuthed()) return;
    try {
      await flagComment({
        type,
        itemId,
        commentId: comment.id,
      });
      setRawComments((prev) =>
        prev.map((c) =>
          c.id === comment.id
            ? { ...c, flags: (c.flags || 0) + 1 }
            : c
        )
      );
      alert("Thanks! We'll review this comment.");
    } catch (err) {
      alert("Couldn't flag comment right now.");
    }
  };

  const renderSortOptions = () => (
    <View style={styles.sortRow}>
      {SORT_OPTIONS.map((opt) => {
        const active = sort === opt.value;
        return (
          <TouchableOpacity
            key={opt.value}
            style={[
              styles.sortChip,
              {
                borderColor: active ? palette.accent : palette.border,
                backgroundColor: active
                  ? palette.accent
                  : palette.surface,
              },
            ]}
            onPress={() => setSort(opt.value)}
          >
            <Text
              style={[
                styles.sortChipText,
                { color: active ? "#fff" : palette.textPrimary },
              ]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <View
      style={[
        styles.container,
        {
          borderColor: palette.border,
          backgroundColor: palette.surface,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <Text style={[styles.heading, { color: palette.textPrimary }]}>
          Comments
        </Text>
        <Text style={[styles.counter, { color: palette.textSecondary }]}>
          {rawComments.length} total
        </Text>
      </View>

      {renderSortOptions()}

      {error ? (
        <Text style={[styles.errorText, { color: palette.danger }]}>
          {error}
        </Text>
      ) : null}

      {initialLoading ? (
        <ActivityIndicator style={{ marginVertical: 16 }} />
      ) : thread.length === 0 ? (
        <Text
          style={[styles.emptyText, { color: palette.textSecondary }]}
        >
          No comments yet. Be the first to share a take.
        </Text>
      ) : (
        <View>
          {thread.map((comment) => (
            <CommentRow
              key={comment.id}
              comment={comment}
              palette={palette}
              onReply={(c) => setReplyTarget(c)}
              onVote={handleVote}
              onFlag={handleFlag}
            />
          ))}
        </View>
      )}

      {hasMore && !initialLoading ? (
        <TouchableOpacity
          style={[
            styles.loadMoreButton,
            { borderColor: palette.border },
          ]}
          disabled={loadingMore}
          onPress={handleLoadMore}
        >
          <Text
            style={[
              styles.loadMoreText,
              { color: palette.accent },
            ]}
          >
            {loadingMore ? "Loading..." : `Load ${COMMENTS_PAGE_SIZE} more`}
          </Text>
        </TouchableOpacity>
      ) : null}

      <View style={[styles.composer, { borderTopColor: palette.border }]}>
        {replyTarget ? (
          <View
            style={[
              styles.replyBanner,
              { backgroundColor: `${palette.accent}15` },
            ]}
          >
            <Text
              style={[
                styles.replyBannerText,
                { color: palette.textPrimary },
              ]}
            >
              Replying to {replyTarget.authorName || "Reader"}
            </Text>
            <TouchableOpacity onPress={() => setReplyTarget(null)}>
              <Text
                style={[
                  styles.replyBannerDismiss,
                  { color: palette.accent },
                ]}
              >
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <TextInput
          style={[
            styles.input,
            {
              borderColor: palette.border,
              backgroundColor: palette.background,
              color: palette.textPrimary,
            },
          ]}
          placeholder={
            user ? "Add a comment" : "Sign in to join the discussion"
          }
          placeholderTextColor={palette.muted}
          editable={!!user && !posting}
          multiline
          value={text}
          onChangeText={setText}
        />
        <TouchableOpacity
          style={[
            styles.submitButton,
            {
              backgroundColor: user ? palette.accent : palette.border,
              opacity: posting ? 0.7 : 1,
            },
          ]}
          onPress={handleSubmit}
          disabled={!user || posting}
        >
          <Text style={styles.submitText}>
            {posting ? "Posting..." : replyTarget ? "Reply" : "Comment"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 32,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  heading: {
    fontSize: 20,
    fontWeight: "600",
  },
  counter: {
    fontSize: 13,
  },
  sortRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  sortChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderRadius: 999,
  },
  sortChipText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  errorText: {
    marginBottom: 12,
  },
  emptyText: {
    textAlign: "center",
    marginVertical: 12,
  },
  loadMoreButton: {
    alignSelf: "center",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 8,
    marginTop: 12,
  },
  loadMoreText: {
    fontWeight: "600",
  },
  commentRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  commentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  commentAuthor: {
    fontWeight: "600",
  },
  commentMeta: {
    fontSize: 12,
  },
  commentBody: {
    marginBottom: 8,
    fontSize: 15,
  },
  commentActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  actionText: {
    fontSize: 12,
    fontWeight: "600",
  },
  composer: {
    marginTop: 20,
    borderTopWidth: 1,
    paddingTop: 12,
  },
  replyBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  replyBannerText: {
    fontSize: 13,
  },
  replyBannerDismiss: {
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    minHeight: 72,
    textAlignVertical: "top",
    marginBottom: 10,
  },
  submitButton: {
    alignSelf: "flex-end",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
  },
  submitText: {
    color: "#fff",
    fontWeight: "600",
  },
});
