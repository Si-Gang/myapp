export default ({ config }) => {
  const profile = process.env.EAS_BUILD_PROFILE || 'production';

  if (profile === 'preview') {
    config.name = 'myapp Preview';
    config.slug = 'myapp-preview';
    config.android = {
      ...config.android,
      package: 'com.sigang.myapp.preview',
    };
    config.ios = {
      ...config.ios,
      bundleIdentifier: 'com.sigang.myapp.preview',
    };
  }

  if (profile === 'development') {
    config.android = {
      ...config.android,
      package: 'com.sigang.myapp.dev',
    };
    config.ios = {
      ...config.ios,
      bundleIdentifier: 'com.sigang.myapp.dev',
    };
  }

  return config;
};
