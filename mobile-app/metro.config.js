// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Explicitly resolve expo/virtual modules to prevent bundling failures
const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'expo/virtual/rsc') {
    return {
      filePath: path.resolve(__dirname, 'node_modules/expo/virtual/rsc.js'),
      type: 'sourceFile',
    };
  }
  if (moduleName === 'expo/virtual/env') {
    return {
      filePath: path.resolve(__dirname, 'node_modules/expo/virtual/env.js'),
      type: 'sourceFile',
    };
  }
  if (moduleName === 'expo/virtual/streams') {
    return {
      filePath: path.resolve(__dirname, 'node_modules/expo/virtual/streams.js'),
      type: 'sourceFile',
    };
  }
  if (defaultResolveRequest) {
    return defaultResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
