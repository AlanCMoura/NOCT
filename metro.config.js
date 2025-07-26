const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Configuração mais direta
config.resolver = {
  ...config.resolver,
  blockList: [
    /.*\/components\/.*\.tsx?$/,
    /.*\/hooks\/.*\.tsx?$/,  
    /.*\/contexts\/.*\.tsx?$/,
    /.*\/utils\/.*\.tsx?$/,
    /.*\/styles\/.*\.css$/,
  ]
};

module.exports = withNativeWind(config, { input: './src/styles/global.css' });