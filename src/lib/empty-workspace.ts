import type {Workspace} from './types';
export function emptyWorkspace(slug='my-agency'):Workspace{return {version:2,broker:{name:'My Agency',slug,tagline:'Find your next property',city:'',phone:'',email:'',about:'',color:'#6258e8',siteColor:'#171719'},properties:[],leads:[],visits:[]}}
