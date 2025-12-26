//utils/comments.js

import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  orderBy,
  query,
  serverTimestamp,
  startAfter,
  updateDoc,
} from "firebase/firestore";
import { db } from "../utils/firebase";

export const CommentSort = {
  NEWEST: "newest",
  OLDEST: "oldest",
  TOP: "top",
};

export const COMMENTS_PAGE_SIZE = 12;
export const MAX_THREAD_DEPTH = 4;

const getCollectionRoot = (type) =>
  type === "theme" ? "themes" : "stories";

const getCommentsCollection = (type, itemId) =>
  collection(db, getCollectionRoot(type), itemId, "comments");

const serializeComment = (snapshot) => {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    ...data,
    createdAt: data?.createdAt?.toMillis?.() ?? null,
    updatedAt: data?.updatedAt?.toMillis?.() ?? null,
  };
};

export async function addComment({
  type,
  itemId,
  text,
  parentId = null,
  user,
}) {
  const col = getCommentsCollection(type, itemId);
  let depth = 0;

  if (parentId) {
    const parentSnap = await getDoc(
      doc(db, getCollectionRoot(type), itemId, "comments", parentId)
    );
    const parentDepth = parentSnap.exists()
      ? parentSnap.data()?.depth || 0
      : 0;
    depth = Math.min(MAX_THREAD_DEPTH, parentDepth + 1);
  }

  const displayName =
    user?.displayName?.trim?.() ||
    user?.email ||
    user?.phoneNumber ||
    "Reader";

  const payload = {
    text,
    parentId: parentId || null,
    depth,
    authorId: user?.uid || null,
    authorName: displayName,
    upvotes: 0,
    downvotes: 0,
    flags: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const ref = await addDoc(col, payload);
  return ref;
}

export async function fetchComments({
  type,
  itemId,
  sort = CommentSort.NEWEST,
  cursor = null,
}) {
  const baseRef = getCommentsCollection(type, itemId);
  let constraints = [];

  if (sort === CommentSort.OLDEST) {
    constraints = [orderBy("createdAt", "asc")];
  } else if (sort === CommentSort.TOP) {
    constraints = [orderBy("upvotes", "desc"), orderBy("createdAt", "desc")];
  } else {
    constraints = [orderBy("createdAt", "desc")];
  }

  let q = query(baseRef, ...constraints, limit(COMMENTS_PAGE_SIZE));
  if (cursor) {
    q = query(baseRef, ...constraints, startAfter(cursor), limit(COMMENTS_PAGE_SIZE));
  }

  const snapshot = await getDocs(q);
  return {
    comments: snapshot.docs.map(serializeComment),
    lastVisible: snapshot.docs[snapshot.docs.length - 1] || null,
  };
}

export async function voteOnComment({
  type,
  itemId,
  commentId,
  delta,
}) {
  const ref = doc(
    db,
    getCollectionRoot(type),
    itemId,
    "comments",
    commentId
  );

  if (delta > 0) {
    await updateDoc(ref, { upvotes: increment(1) });
  } else if (delta < 0) {
    await updateDoc(ref, { downvotes: increment(1) });
  }
}

export async function flagComment({ type, itemId, commentId }) {
  const ref = doc(
    db,
    getCollectionRoot(type),
    itemId,
    "comments",
    commentId
  );
  await updateDoc(ref, { flags: increment(1) });
}
