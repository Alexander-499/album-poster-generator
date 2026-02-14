export const chunkedTracks = (albumData, albumSongsPerColumn) => {
  if (!albumData) return [];
  const tracks = albumData.tracks.items.map(t => t.name);
  const size = Number(albumSongsPerColumn);
  const result = [];
  for (let i = 0; i < tracks.length; i += size)
    result.push(tracks.slice(i, i + size));
  return result;
};

export const formatDate = dateString => {
  const date = new Date(dateString);
  const day = date.getDate();
  const suffix =
    day % 10 === 1 && day !== 11 ? "st" :
    day % 10 === 2 && day !== 12 ? "nd" :
    day % 10 === 3 && day !== 13 ? "rd" : "th";
  return `${date.toLocaleString("en-US", { month: "long" })} ${day}${suffix}, ${date.getFullYear()}`;
}

export const formatTime = totalSeconds => `${Math.floor(totalSeconds / 60)}:${(totalSeconds % 60).toString().padStart(2, '0')}`;
export const formatArtists = artists => artists.length > 1 ? `${artists.slice(0,-1).join(", ")} & ${artists.at(-1)}` : artists[0];