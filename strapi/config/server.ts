export default ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),

  // <<< ADD
  url: env('URL', env('PUBLIC_URL', 'https://csontkovacsbence.hu')),
  proxy: true,
  // >>> ADD

  app: {
    keys: env.array('APP_KEYS') || ['tobemodified1', 'tobemodified2'],
  },
});
