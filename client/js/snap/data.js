export let PHOTO_POOL = [];

function seededColor(seed){
  const hues = [28, 18, 40, 12, 34, 8, 46];
  const h = hues[seed % hues.length];
  return `linear-gradient(150deg, hsl(${h},45%,78%), hsl(${h+8},38%,58%))`;
}

export async function initPhotos(onLoadCallback) {
  try {
    const res = await fetch('/photos/metadata.json');
    if (res.ok) {
      const data = await res.json();
      const ratios = [ [4,5], [1,1], [3,4], [5,4], [4,3] ];
      
      PHOTO_POOL = data.map((photo, i) => {
        const ratio = ratios[i % ratios.length];
        return {
          ...photo,
          bg: seededColor(i + 1),
          ratioW: ratio[0],
          ratioH: ratio[1],
          location: photo.location,
          tag: photo.tag,
          story: photo.story
        };
      });
    }
  } catch(e) {
    console.warn("Could not load metadata.json. Gallery will be empty.", e);
  }
  
  if (onLoadCallback) onLoadCallback(PHOTO_POOL);
}