import { useState, useEffect } from 'react';
import { getBrandingConfig } from '../services/configService';

const DEFAULT_BRANDING = {
  schoolName: import.meta.env.VITE_SCHOOL_NAME || 'M.B. Public School',
  schoolCode: import.meta.env.VITE_SCHOOL_CODE || 'MBPS',
  schoolAddress: import.meta.env.VITE_SCHOOL_ADDRESS || 'Kisoli, Bulandshahr, Uttar Pradesh',
  schoolPhone1: import.meta.env.VITE_SCHOOL_PHONE_1 || '8171716781',
  schoolPhone2: import.meta.env.VITE_SCHOOL_PHONE_2 || '7819053105'
};

let cachedBranding = null;
let cachePromise = null;

export const useBranding = () => {
  const [branding, setBranding] = useState(cachedBranding || DEFAULT_BRANDING);
  const [loading, setLoading] = useState(!cachedBranding);

  useEffect(() => {
    if (cachedBranding) {
      setBranding(cachedBranding);
      setLoading(false);
      return;
    }

    if (!cachePromise) {
      cachePromise = getBrandingConfig()
        .then((res) => {
          if (res?.data) {
            cachedBranding = res.data;
          }
          return cachedBranding || DEFAULT_BRANDING;
        })
        .catch((err) => {
          console.warn('Failed to load dynamic branding config, using defaults:', err);
          return DEFAULT_BRANDING;
        });
    }

    let isMounted = true;
    cachePromise.then((data) => {
      if (isMounted) {
        setBranding(data);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  return { branding, loading };
};
