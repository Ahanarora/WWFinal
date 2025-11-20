import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  limit,
  startAfter,
  getDocs,
  updateDoc,
  doc,
  increment,
} from "firebase/firestore";
import { db } from "../firebaseConfig";

const PAGE_SIZE = 10;

export const CommentSort = {
  NEWEST: "newest",
  OLDEST: "oldest",
  TOP: "top",
};

const getCommentsCollection = (type, itemId) =>
  collection(db, type === "story" ? "stories" : "themes", itemId, "comments");

export async function addComment({
  type,
  itemId,
  text,
  parentId = null,
  user,
}) {
  const col = getCommentsCollection(type, itemId);
  const payload = {
    text,
    parentId,
    authorId: user?.uid,
    authorName: user?.email || "Reader",
    upvotes: 0,
    downvotes: 0,
    flags: 0,
    createdAt: serverTimestamp(),
  };
  await addDoc(col, payload);
}

export async function fetchComments({ type, itemId, sort = CommentSort.NEWEST, cursor = null }) {
  let q = query(getCommentsCollection(type, itemId));

  if (sort === CommentSort.OLDEST) {
    q = query(q, orderBy("createdAt", "asc"));
  } else if (sort === CommentSort.TOP) {
    q = query(q, orderBy("upvotes", "desc"), orderBy("createdAt", "desc"));
  } else {
    q = query(q, orderBy("createdAt", "desc"));
  }

  q = query(q, limit(PAGE_SIZE));
  if (cursor) {
    q = query(q, startAfter(cursor));
  }

  const snapshot = await getDocs(q);
  return {
    comments: snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
    lastVisible: snapshot.docs[snapshot.docs.length - 1] || null,
  };
}

export async function voteOnComment({ type, itemId, commentId, delta }) {
  const ref = doc(db, type === "story" ? "stories" : "themes", itemId, "comments", commentId);
  if (delta === 1) {
    await updateDoc(ref, { upvotes: increment(1) });
  } else if (delta === -1) {
    await updateDoc(ref, { downvotes: increment(1) });
  }
}

export async function flagComment({ type, itemId, commentId }) {
  const ref = doc(db, type === "story" ? "stories" : "themes", itemId, "comments", commentId);
  await updateDoc(ref, { flags: increment(1) });
}
