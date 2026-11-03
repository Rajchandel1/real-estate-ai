/** Runs mutations in order and keeps a rejected mutation from poisoning the queue. */
export class SerialQueue {
 private tail:Promise<void>=Promise.resolve();
 get settled(){return this.tail}
 run<T>(operation:()=>Promise<T>):Promise<T>{const task=this.tail.then(operation);this.tail=task.then(()=>{},()=>{});return task}
}
