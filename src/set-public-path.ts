/*
 * @Description:
 * @Version: 0.1
 * @Author: EveChee
 * @Date: 2020-05-20 17:02:54
 * @LastEditTime: 2020-05-20 17:02:55
 */
import { setPublicPath } from 'systemjs-webpack-interop';

export function setPath(appName:string){
  (<any>window).__STL_S_SPA__&&setPublicPath(appName)
}
