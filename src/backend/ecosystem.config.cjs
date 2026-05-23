module.exports = {
  apps: [
    {
      name: 'personal-website-api',
      script: './index.mjs',
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      watch: false,
      node_args: `--env-file=${__dirname}/.env`,
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
    },
  ],
};
