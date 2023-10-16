import PublicMessage from './PublicMessage'

export default (type: 'music' | 'video', title: string, singer: string, cover: string, color: string, BitRate?: number) => {
  const typeMap = {
    music: 0,
    video: 1,
  }
  let data

  if (!BitRate) {
    data = `m__4=${typeMap[type]}>${title}>${singer}>${cover}>${color}>11451`
  } else {
    data = `m__4=${typeMap[type]}>${title}>${singer}>${cover}>${color}>${BitRate}`
  }

  return PublicMessage(data, color)
}
