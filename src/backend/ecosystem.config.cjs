module.exports = {
  apps: [
    {
      name: 'personal-website-api',
      script: 'dist/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
    },
  ],
};
