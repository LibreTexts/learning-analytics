import { defineConfig } from '@adonisjs/shield'

const shieldConfig = defineConfig({
  /**
   * Configure CSP policies for your app. Refer documentation
   * to learn more
   */
  csp: {
    enabled: true,
    directives: {
      'default-src': ["'self'"],
      'script-src': ["'self'", "'unsafe-eval'", "'unsafe-inline'", 'https://*.libretexts.org', 'https://*.libretexts.net', 'https://*.cloudflare.com', 'https://cdn.jsdelivr.net/npm/iframe-resizer@4.4.5/js/iframeResizer.contentWindow.min.js'],
      'frame-ancestors': ["'self'", 'https://*.libretexts.org', 'https://*.libretexts.net'],
      'connect-src': ["'self'", 'https://*.libretexts.org', 'https://*.libretexts.net', 'https://*.cloudflare.com', 'https://cdn.jsdelivr.net/npm/iframe-resizer@4.4.5/js/iframeResizer.contentWindow.map'],
      'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      'img-src': ["'self'", 'data:', 'blob:', 'https://*.libretexts.org', 'https://*.libretexts.net'],
      'font-src': ["'self'", 'https://fonts.gstatic.com'],
      'object-src': ["'none'"],
      'base-uri': ["'self'"],
      'form-action': ["'self'"],
      'block-all-mixed-content': [],
      'upgrade-insecure-requests': [],
    },
    reportOnly: false,
  },

  /**
   * Configure CSRF protection options. Refer documentation
   * to learn more
   */
  csrf: {
    enabled: false, // TODO: Enable CSRF protection
    exceptRoutes: [],
    enableXsrfCookie: true,
    methods: ['POST', 'PUT', 'PATCH', 'DELETE'],
  },

  /**
   * Control how your website should be embedded inside
   * iFrames
   */
  xFrame: {
    enabled: false,
    action: undefined,
  },

  /**
   * Force browser to always use HTTPS
   */
  hsts: {
    enabled: true,
    maxAge: '180 days',
  },

  /**
   * Disable browsers from sniffing the content type of a
   * response and always rely on the "content-type" header.
   */
  contentTypeSniffing: {
    enabled: true,
  },
})

export default shieldConfig
