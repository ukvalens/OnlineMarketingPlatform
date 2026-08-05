import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../api';

export default function usePageView() {
  const { pathname } = useLocation();
  useEffect(() => {
    api.post('/analytics/track', {
      path: pathname,
      referrer: document.referrer || null,
    }).catch(() => {});
  }, [pathname]);
}
