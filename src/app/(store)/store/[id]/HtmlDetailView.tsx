"use client";

import { useEffect, useRef } from "react";

const BRIDGE_SCRIPT = `
<script>
  (function() {
    function postHeight() {
      const h = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.offsetHeight
      );
      window.parent.postMessage({ __proreShop: true, type: 'resize', height: h }, '*');
    }
    function bindPurchase() {
      const selectors = [
        '.cta-btn',
        '[data-purchase]',
        'a[href="#"]',
        'a[href="#purchase"]',
        'button[type="submit"]'
      ];
      const els = document.querySelectorAll(selectors.join(','));
      els.forEach(function(el) {
        if (el.dataset.proreBound) return;
        el.dataset.proreBound = '1';
        el.addEventListener('click', function(e) {
          e.preventDefault();
          window.parent.postMessage({ __proreShop: true, type: 'purchase' }, '*');
        });
      });
    }
    function init() {
      bindPurchase();
      postHeight();
      if (typeof ResizeObserver !== 'undefined') {
        new ResizeObserver(postHeight).observe(document.body);
      }
      window.addEventListener('load', function() { bindPurchase(); postHeight(); });
      setTimeout(postHeight, 300);
      setTimeout(postHeight, 1500);
      setTimeout(postHeight, 3000);
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  })();
<\/script>
`;

function injectBridge(html: string): string {
  if (html.includes("</body>")) {
    return html.replace("</body>", `${BRIDGE_SCRIPT}</body>`);
  }
  return html + BRIDGE_SCRIPT;
}

export default function HtmlDetailView({
  html,
  subjectId,
  subjectName,
  price,
}: {
  html: string;
  subjectId: string;
  subjectName: string;
  price: number;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const data = event.data as { __proreShop?: boolean; type?: string; height?: number };
      if (!data || !data.__proreShop) return;
      if (data.type === "resize" && iframeRef.current && typeof data.height === "number") {
        iframeRef.current.style.height = `${data.height}px`;
      }
      if (data.type === "purchase") {
        const userId = "guest";
        const orderId = `ord-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const query = new URLSearchParams({
          subjectId,
          amount: String(price),
          orderId,
          userId,
          orderName: subjectName,
        }).toString();
        window.location.href = `/checkout?${query}`;
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [subjectId, subjectName, price]);

  return (
    <iframe
      ref={iframeRef}
      srcDoc={injectBridge(html)}
      sandbox="allow-scripts allow-same-origin"
      style={{ width: "100%", border: "none", display: "block", minHeight: "100vh" }}
      title="상세 페이지"
    />
  );
}
