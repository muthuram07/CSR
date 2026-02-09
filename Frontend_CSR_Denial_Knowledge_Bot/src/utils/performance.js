import React, { Suspense, lazy } from 'react';

// Performance optimization: Lazy load components with error boundaries
const LazyHomepage = lazy(() => 
  import('../pages/Homepage').catch(err => {
    console.error('Failed to load Homepage:', err);
    return { default: () => <div>Error loading homepage</div> };
  })
);

const LazySignInPage = lazy(() => 
  import('../pages/SignInpage').catch(err => {
    console.error('Failed to load SignInPage:', err);
    return { default: () => <div>Error loading sign in page</div> };
  })
);

const LazySignUpPage = lazy(() => 
  import('../pages/SignUppage').catch(err => {
    console.error('Failed to load SignUpPage:', err);
    return { default: () => <div>Error loading sign up page</div> };
  })
);

const LazyChatBot = lazy(() => 
  import('../components/ChatBot/ChatBot').catch(err => {
    console.error('Failed to load ChatBot:', err);
    return { default: () => <div>Error loading chatbot</div> };
  })
);

// Performance monitoring utilities
export const performanceUtils = {
  // Measure component render time
  measureRender: (componentName, fn) => {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    console.log(`${componentName} render time: ${end - start}ms`);
    return result;
  },

  // Debounce function for search/input optimization
  debounce: (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // Throttle function for scroll events
  throttle: (func, limit) => {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  // Memory cleanup utilities
  cleanup: {
    // Clear large objects from memory
    clearLargeObjects: (obj) => {
      for (const key in obj) {
        if (obj[key] && typeof obj[key] === 'object') {
          delete obj[key];
        }
      }
    },

    // Reset arrays to free memory
    resetArray: (arr) => {
      arr.length = 0;
    }
  },

  // Bundle size monitoring
  monitorBundleSize: () => {
    if (process.env.NODE_ENV === 'development') {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'measure') {
            console.log(`Performance: ${entry.name} - ${entry.duration}ms`);
          }
        }
      });
      observer.observe({ entryTypes: ['measure'] });
    }
  }
};

// Optimized image loading component
export const OptimizedImage = ({ src, alt, className, ...props }) => {
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    const img = new Image();
    img.onload = () => setIsLoaded(true);
    img.onerror = () => setHasError(true);
    img.src = src;
  }, [src]);

  if (hasError) {
    return <div className={`image-error ${className}`}>Failed to load image</div>;
  }

  return (
    <img
      src={src}
      alt={alt}
      className={`${className} ${isLoaded ? 'loaded' : 'loading'}`}
      loading="lazy"
      {...props}
    />
  );
};

// Virtual scrolling hook for large lists
export const useVirtualScroll = (items, itemHeight, containerHeight) => {
  const [scrollTop, setScrollTop] = React.useState(0);

  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(
    startIndex + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  );

  const visibleItems = items.slice(startIndex, endIndex);
  const offsetY = startIndex * itemHeight;

  return {
    visibleItems,
    offsetY,
    onScroll: performanceUtils.throttle((e) => setScrollTop(e.target.scrollTop), 16)
  };
};

export {
  LazyHomepage,
  LazySignInPage,
  LazySignUpPage,
  LazyChatBot
};
