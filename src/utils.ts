export const infoLog = (...args: any[]) => {
  console.log(`[INFO][${new Date()}]`, ...args);
}

export const errorLog = (...args: any[]) => {
  console.error(`[ERROR][${new Date()}]`, ...args);
}