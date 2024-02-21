export default (type: 'music' | 'video', title: string, signer: string, cover: string, link: string, url: string, duration: number, lyrics:string | null = null, origin: 'netease' | null = null) => {
  const typeMap = {
    music: "=0",
    video: "=1",
    netease: "@0"
  };

  let t:string

  if(origin){
    t = origin
  } else {
    t = type
  }

  
  const data = JSON.stringify({
    s: url.substr(4),
    d: duration,
    c: cover.substr(4),
    n: title,
    r: signer,
    b: `${typeMap[t]}`,
    o: link.substr(4),
    l: lyrics
  });

  return `&1${data}`;
};
