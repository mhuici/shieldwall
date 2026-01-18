import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Transpilación de paquetes de AWS Amplify
  transpilePackages: [
    '@aws-amplify/ui-react-liveness',
    '@aws-amplify/ui-react',
    'aws-amplify',
  ],
  // Turbopack config vacío para evitar errores
  turbopack: {},
  // Webpack config para manejar módulos de TensorFlow
  // Usado cuando se ejecuta con --webpack flag
  webpack: (config, { isServer }) => {
    // TensorFlow y MediaPipe solo deben ejecutarse en el cliente
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        '@tensorflow/tfjs': 'commonjs @tensorflow/tfjs',
        '@tensorflow/tfjs-core': 'commonjs @tensorflow/tfjs-core',
        '@tensorflow/tfjs-converter': 'commonjs @tensorflow/tfjs-converter',
        '@tensorflow-models/face-detection': 'commonjs @tensorflow-models/face-detection',
        '@mediapipe/face_detection': 'commonjs @mediapipe/face_detection',
      });
    }
    return config;
  },
};

export default nextConfig;
