'use client';

import { useEffect, useState } from 'react';
import { db } from '../../../lib/firebase/client.js';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';

export function useActivityLog(boardId) {
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    const actRef = collection(db, 'boards', boardId, 'activity');
    const q = query(actRef, orderBy('createdAt', 'desc'), limit(25));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = [];
      snapshot.forEach((doc) => {
        list.push(doc.data());
      });
      setActivities(list);
    }, (error) => {
      console.error("Activity stream snapshot error: ", error);
    });

    return () => unsubscribe();
  }, [boardId]);

  return activities;
}
