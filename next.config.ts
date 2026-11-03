import type { NextConfig } from 'next';
const nextConfig: NextConfig = {
 reactStrictMode:true,poweredByHeader:false,outputFileTracingRoot:process.cwd(),
 distDir:process.env.NODE_ENV==='development'?'.next-dev':'.next',
 experimental:{serverActions:{bodySizeLimit:'4mb'}},
 webpack(config){if(process.env.DISABLE_BUILD_CACHE==='true')config.cache=false;return config},
 async headers(){return [{source:'/:path*',headers:[
  {key:'X-Content-Type-Options',value:'nosniff'},
  {key:'X-Frame-Options',value:'DENY'},
  {key:'Referrer-Policy',value:'strict-origin-when-cross-origin'},
  {key:'Permissions-Policy',value:'camera=(), microphone=(), geolocation=()'},
  ...(process.env.NODE_ENV==='production'?[{key:'Strict-Transport-Security',value:'max-age=31536000; includeSubDomains'}]:[])
 ]}]}
};
export default nextConfig;
