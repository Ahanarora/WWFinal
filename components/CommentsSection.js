import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { useUserData } from "../contexts/UserDataContext";
import {
  fetchComments,
  addComment,
  voteOnComment,
  flagComment,
  CommentSort,
} from "../utils/comments";

const SORT_OPTIONS = [
  { label: "Newest", value: CommentSort.NEWEST },
  { label: "Oldest", value: CommentSort.OLDEST },
  { label: "Top", value: CommentSort.TOP },
];

function CommentItem({ comment, depth = 0, onReply, onVote, onFlag }) {
  return (
    <View style={[styles.commentContainer, { marginLeft: depth * 16 }]}> 
      <View style={styles.commentHeader}>
        <Text style={styles.commentAuthor}>{comment.authorName || "Reader"}</Text>
        <Text style={styles.commentMeta}>{comment.upvotes - comment.downvotes} pts</Text>
      </View>
      <Text style={styles.commentBody}>{comment.text}</Text>
      <View style={styles.commentActions}>
        <TouchableOpacity onPress={() => onVote(comment, 1)}>
          <Text style={styles.actionButton}>▲ Upvote</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onVote(comment, -1)}>
          <Text style={styles.actionButton}>▼ Downvote</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onReply(comment)}>
          <Text style={styles.actionButton}>Reply</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onFlag(comment)}>
          <Text style={styles.actionButton}>Flag</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function CommentsSection({ type, itemId }) {
  const { user, themeColors } = useUserData();
  const palette = themeColors || {
    background: "#fff",
    surface: "#fff",
    border: "#E5E7EB",
    textPrimary: "#0F172A",
    textSecondary: "#6B7280",
    accent: "#2563EB",
    muted: "#94A3B8",
  };
  const styles = useMemo(() => createStyles(palette), [palette]);
  const [comments, setComments] = useState([]);
  const [sort, setSort] = useState(CommentSort.NEWEST);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [replyTarget, setReplyTarget] = useState(null);
  const [text, setText] = useState("");
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    resetAndLoad();
  }, [sort, itemId]);

  const resetAndLoad = async () => {
    setLoading(true);
    setComments([]);
    setCursor(null);
    setHasMore(true);
    await loadMore(true);
    setLoading(false);
  };

  const loadMore = async (reset = false) => {
    if (!hasMore && !reset) return;
    const data = await fetchComments({
      type,
      itemId,
      sort,
      cursor: reset ? null : cursor,
    });
    setComments((prev) => (reset ? data.comments : [...prev, ...data.comments]));
    setCursor(data.lastVisible);
    setHasMore(!!data.lastVisible);
  };

  const tree = useMemo(() => {
    const map = {};
    comments.forEach((c) => {
      map[c.id] = { ...c, children: [] };
    });
    const roots = [];
    Object.values(map).forEach((comment) => {
      if (comment.parentId && map[comment.parentId]) {
        map[comment.parentId].children.push(comment);
      } else {
        roots.push(comment);
      }
    });
    return roots;
  }, [comments]);

  const renderThread = (nodes, depth = 0) =>
    nodes.map((node) => (
      <View key={node.id}>
        <CommentItem
          comment={node}
          depth={depth}
          onReply={(c) => setReplyTarget(c)}
          onVote={(c, delta) => voteOnComment({ type, itemId, commentId: c.id, delta })}
          onFlag={(c) => flagComment({ type, itemId, commentId: c.id })}
        />
        {node.children?.length > 0 && renderThread(node.children, depth + 1)}
      </View>
    ));

  const submitComment = async () => {
    if (!user) {
      alert("Sign in to join the discussion.");
      return;
    }
    if (!text.trim()) return;
    try {
      setPosting(true);
      await addComment({
        type,
        itemId,
        text: text.trim(),
        parentId: replyTarget?.id || null,
        user,
      });
      setText("");
      setReplyTarget(null);
      await resetAndLoad();
    } catch (err) {
      alert("Failed to post comment");
    } finally {
      setPosting(false);
    }
  };

  const renderSortOptions = () => (
    <View style={styles.sortRow}>
      {SORT_OPTIONS.map((opt) => (
        <TouchableOpacity
          key={opt.value}
          style={[styles.sortChip, sort === opt.value && styles.sortChipActive]}
          onPress={() => setSort(opt.value)}
        >
          <Text
            style={[
              styles.sortChipText,
              sort === opt.value && styles.sortChipTextActive,
            ]}
          >
            {opt.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Comments</Text>
        <Text style={styles.sectionMeta}>{comments.length} total</Text>
      </View>
      {renderSortOptions()}

      {loading ? (
        <ActivityIndicator style={{ marginVertical: 16 }} />
      ) : comments.length === 0 ? (
        <Text style={styles.emptyState}>No comments yet. Be the first!</Text>
      ) : (
        <View>{renderThread(tree)}</View>
      )}

      {hasMore && !loading && (
        <TouchableOpacity style={styles.loadMoreButton} onPress={() => loadMore()}>
          <Text style={styles.loadMoreText}>Load more</Text>
        </TouchableOpacity>
      )}

      <View style={styles.composerBox}>
        {replyTarget ? (
          <View style={styles.replyBanner}>
            <Text style={styles.replyBannerText}>
              Replying to {replyTarget.authorName || "Reader"}
            </Text>
            <TouchableOpacity onPress={() => setReplyTarget(null)}>
              <Text style={styles.replyBannerDismiss}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : null}
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder={user ? "Add a comment" : "Sign in to comment"}
          editable={!!user}
          multiline
        />
        <TouchableOpacity
          style={[styles.submitButton, !user && { opacity: 0.5 }]}
          disabled={!user || posting}
          onPress={submitComment}
        >
          <Text style={styles.submitButtonText}>
            {posting ? "Posting..." : replyTarget ? "Reply" : "Comment"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (palette) =>
  StyleSheet.create({
    container: {
      marginTop: 24,
      padding: 16,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: palette.border,
      backgroundColor: palette.surface,
    },
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: "600",
      color: palette.textPrimary,
    },
    sectionMeta: {
      fontSize: 13,
      color: palette.textSecondary,
    },
    sortRow: {
      flexDirection: "row",
      gap: 8,
      marginBottom: 16,
    },
    sortChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: palette.border,
    },
    sortChipActive: {
      backgroundColor: palette.accent,
      borderColor: palette.accent,
    },
    sortChipText: {
      fontSize: 12,
      color: palette.textPrimary,
      textTransform: "uppercase",
    },
    sortChipTextActive: {
      color: "#fff",
    },
    emptyState: {
      textAlign: "center",
      color: palette.textSecondary,
      marginVertical: 16,
    },
    loadMoreButton: {
      alignSelf: "center",
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: palette.border,
      marginTop: 12,
    },
    loadMoreText: {
      color: palette.accent,
      fontWeight: "600",
    },
    commentContainer: {
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: palette.border,
    },
    commentHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 4,
    },
    commentAuthor: {
      fontWeight: "600",
      color: palette.textPrimary,
    },
    commentMeta: {
      color: palette.textSecondary,
      fontSize: 12,
    },
    commentBody: {
      color: palette.textPrimary,
      marginBottom: 6,
    },
    commentActions: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
    },
    actionButton: {
      color: palette.accent,
      fontSize: 12,
    },
    composerBox: {
      marginTop: 20,
      borderTopWidth: 1,
      borderTopColor: palette.border,
      paddingTop: 12,
    },
    replyBanner: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 8,
      backgroundColor: `${palette.accent}22`,
      borderRadius: 8,
      marginBottom: 8,
    },
    replyBannerText: {
      color: palette.textPrimary,
    },
    replyBannerDismiss: {
      color: palette.accent,
      fontWeight: "600",
    },
    input: {
      minHeight: 60,
      borderWidth: 1,
      borderColor: palette.border,
      borderRadius: 12,
      padding: 12,
      textAlignVertical: "top",
      marginBottom: 10,
      backgroundColor: palette.background,
      color: palette.textPrimary,
    },
    submitButton: {
      alignSelf: "flex-end",
      backgroundColor: palette.accent,
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: 999,
    },
    submitButtonText: {
      color: "#fff",
      fontWeight: "600",
    },
  });
