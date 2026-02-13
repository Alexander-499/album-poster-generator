<script setup>
import { snapdom } from "@zumer/snapdom";
import { ref, computed } from "vue";

const albumId = ref("");
const albumSongsSize = ref(0.6);
const albumSongsOffset = ref(0);
const albumSongsWidth = ref(0.7);
const albumSongsPerColumn = ref(10);
const albumColors = ref(["#cc0000", "#cccc00", "#00cc00", "#00cccc", "#0000cc"]);
const albumGenre = ref("");
const albumNameSize = ref(3);
const albumNameWidth = ref(100);
const albumExportSize = ref(3840);

const albumData = ref(null);
const cover = ref(null);

const chunkedTracks = computed(() => {
  if (!albumData.value) return [];
  const tracks = albumData.value.tracks.items.map(t => t.name);
  const size = Number(albumSongsPerColumn.value);
  const result = [];
  for (let i = 0; i < tracks.length; i += size) {
    result.push(tracks.slice(i, i + size));
  }
  return result;
});

const formatDate = dateString => {
  const date = new Date(dateString);
  const day = date.getDate();
  const suffix =
    day % 10 === 1 && day !== 11 ? "st" :
    day % 10 === 2 && day !== 12 ? "nd" :
    day % 10 === 3 && day !== 13 ? "rd" : "th";
  return `${date.toLocaleString("en-US", { month: "long" })} ${day}${suffix}, ${date.getFullYear()}`;
}

async function takeScreenshot(action, fileType = "png") {
  if (!cover.value) return;

  const options = {
    scale: albumExportSize.value / 480,
    embedFonts: true,
    format: fileType,
    filename: `${albumData.value.artists[0].name} ${albumData.value.name} Album`
  }

  try {
    if (action === "download") {
      await snapdom.download(cover.value, options);
    } else if (action === "print") {
      if (fileType !== "png") return;
      const img = await snapdom.toPng(cover.value, options);
      const printWindow = window.open("", "_blank");
      const css = "body { margin: 0; display: flex; justify-content: center; align-items: center; } img { max-width: 100%; }"
      printWindow.document.write(`<html><head><style>${css}</style></head><body><img src="${img.src}"></body></html>`);
      printWindow.document.close();
      printWindow.onload = () => printWindow.print();
    }
  } catch (error) {
    console.error('Screenshot failed:', error);
  }
}

const formatTime = totalSeconds => `${Math.floor(totalSeconds / 60)}:${(totalSeconds % 60).toString().padStart(2, '0')}`;

async function generateAlbum(customId) {
  const id = customId || albumId.value.replace(/\?(.*)/, "").replace(/(.*)\//g, "");
  if (!id || id.length !== 22) return;
  const url = import.meta.env.PROD ? `/.netlify/functions/album/${id}` : `http://localhost:3000/album/${id}`;
  const response = await fetch(url);
  const data = await response.json();
  console.log(data);
  albumData.value = data;
}

generateAlbum("2uKD5g5T7oklsMHJDcPgLB");
// generateAlbum("5TBmws55nbERqZgYuoY4uB");
</script>

<template>
  <main>
    <header>
      <h1>🖼️🎵 Album Poster Generator</h1>
    </header>
    <div class="center">
      <div class="left">
        <div v-if="albumData" ref="cover" class="cover">
          <span class="artist">{{ albumData.artists[0].name }}</span>
          <img class="cover-art" :src="albumData.images[0].url">
          <div class="bottom">
            <div class="songs">
              <ol v-for="(chunkTracks, i) in chunkedTracks" :key="i">
                <li v-for="(track, trackI) in chunkTracks" :key="trackI">
                  {{ albumSongsPerColumn*i + trackI+1 }}. {{ track }}
                </li>
              </ol>
            </div>
            <div class="code">
              <img :src="`https://scannables.scdn.co/uri/plain/png/eeeeee/black/640/${albumData.uri}`" alt="Spotify Code">
            </div>
            <div class="right">
              <div class="colors">
                <div v-for="color in albumColors" :style="{ backgroundColor: color }"></div>
              </div>
              <div class="info">
                <ul>
                  <li v-if="albumGenre">Genre: {{ albumGenre }}</li>
                  <li>Release Date: {{ formatDate(albumData.release_date) }}</li>
                  <li>Release Label: {{ albumData.label }}</li>
                  <li>Length: {{ formatTime(Math.round(albumData.tracks.items.map(t => t.duration_ms).reduce((sum, num) => sum + num) / 1000)) }}</li>
                </ul>
              </div>
            </div>
            <span class="name">{{ albumData.name }}</span>
          </div>
        </div>
      </div>
      <div class="right">
        <h2>Options</h2>
        <div>
          <label for="albumIdInput">Spotify Album URL/ID</label>
          <input v-model="albumId" id="albumIdInput" type="text" placeholder="2uKD5g5T7oklsMHJDcPgLB" @input="generateAlbum()">
        </div>
        <div>
          <label for="albumSongsSizeInput">Songs Size ({{ albumSongsSize }})</label>
          <input v-model="albumSongsSize" id="albumSongsSizeInput" type="range" min="0.4" max="1" step="0.01">
        </div>
        <div>
          <label for="albumSongsOffsetInput">Songs Offset ({{ albumSongsOffset }})</label>
          <input v-model="albumSongsOffset" id="albumSongsOffsetInput" type="range" min="-0.15" max="0.05" step="0.01">
        </div>
        <div>
          <label for="albumSongsWidthInput">Songs Width ({{ albumSongsWidth }})</label>
          <input v-model="albumSongsWidth" id="albumSongsWidthInput" type="range" min="0.1" max="0.7" step="0.01">
        </div>
        <div>
          <label for="albumSongsPerColumnInput">Songs per Column ({{ albumSongsPerColumn }})</label>
          <input v-model="albumSongsPerColumn" id="albumSongsPerColumnInput" type="range" min="5" max="20">
        </div>
        <div>
          <label>Colors</label>
          <div><input v-for="(color, i) in albumColors" :key="i" v-model="albumColors[i]" type="color"></div>
        </div>
        <div>
          <label for="albumGenreInput">Genre</label>
          <input v-model="albumGenre" id="albumGenreInput" type="text" placeholder="Hip-Hop/Rap">
        </div>
        <div>
          <label for="albumNameSizeInput">Name Size ({{ albumNameSize }})</label>
          <input v-model="albumNameSize" id="albumNameSizeInput" type="range" min="1" max="6" step="0.1">
        </div>
        <div>
          <label for="albumNameWidthInput">Name Width ({{ albumNameWidth }})</label>
          <input v-model="albumNameWidth" id="albumNameWidthInput" type="range">
        </div>
        <div class="album-display">
          <template v-if="albumData">
            <div>
              <img :src="albumData?.images[0].url">
            </div>
            <div>
              <span class="title">{{ albumData.name }}</span>
              <span class="artist">{{ albumData.artists[0].name }}</span>
            </div>
          </template>
        </div>
        <div>
          <label for="albumExportSizeInput">
            Size ({{ albumExportSize }} &times; ~{{ Math.floor(albumExportSize * Math.SQRT2) }} px, A4, ~{{ Math.round(albumExportSize / (21 / 2.54)) }} DPI)
          </label>
          <input v-model="albumExportSize" id="albumExportSizeInput" type="range" min="960" max="6720" step="480">
        </div>
        <div class="export">
          <span>Export</span>
          <button title="Download PNG" @click="takeScreenshot('download', 'png')"><IconDownload/>PNG</button>
          <button title="Download SVG" @click="takeScreenshot('download', 'svg')"><IconDownload/>SVG</button>
          <button title="Download PNG" @click="takeScreenshot('print')"><IconPrinter/>Print</button>
        </div>
      </div>
    </div>
    <footer>
      <a href="https://alexander499.de">Creator</a>
      <a href="https://github.com/Alexander-499/album-poster-generator">GitHub</a>
    </footer>
  </main>
</template>

<style scoped>
main {
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  
  header {
    padding-bottom: 12px;
    user-select: none;
  }
  
  .center {
    display: flex;
    gap: 12px;
    padding-bottom: 32px;
    z-index: 1;

    &:is(:has(#albumNameSizeInput:focus), :has(#albumNameWidthInput:focus))
    > div.left .cover .bottom .name { outline-style: dashed; }

    > div {
      display: flex;
      background-color: var(--color-bg-secondary);
      border: 1px var(--color-border-secondary) solid;
      border-radius: 24px;
      corner-shape: superellipse(1.6);
      padding: 12px;

      &.left {
        align-items: center;
        --cover-height: calc(var(--cover-width) * sqrt(2));
        --cover-width: 480px;
        --cover-font-size: calc(var(--cover-width) * 1/24);

        .cover {
          height: var(--cover-height);
          width: var(--cover-width);
          display: flex;
          flex-direction: column;
          color: black;
          background-color: #eee;
          font-family: "Bebas Neue";
          border: calc(var(--cover-width) * .02) black solid;
          box-sizing: border-box;
          padding: calc(var(--cover-width) * .05) calc(var(--cover-width) * .09);
          overflow: hidden;

          span.artist { font-size: calc(var(--cover-font-size) * 2); }
          .cover-art { width: 100%; }

          .bottom {
            position: relative;
            flex: 1;
            margin-top: calc(var(--cover-width) * .02);

            .songs {
              position: absolute;
              display: flex;
              font-size: calc(var(--cover-font-size) * v-bind(albumSongsSize));
              z-index: 1;

              ol {
                max-width: calc(var(--cover-width) * v-bind(albumSongsWidth));
                white-space: nowrap;
  
                &:not(:first-of-type) { margin-left: calc(var(--cover-width) * v-bind(albumSongsOffset)); }
  
                li {
                  text-overflow: ellipsis;
                  overflow: hidden;
                }
              }
            }

            .code {
              position: absolute;
              left: 0;
              bottom: 0;
              display: flex;
              background-color: red;

              img {
                width: 128px;
              }
            }

            .right {
              position: absolute;
              right: 0;
              display: flex;
              gap: calc(var(--cover-width) * .01);
              flex-direction: column;
              align-items: flex-end;
              justify-content: flex-end;

              .colors {
                display: flex;
                gap: calc(var(--cover-width) * .005);

                > div {
                  height: calc(var(--cover-width) * .055);
                  aspect-ratio: 1;
                }
              }

              .info ul {
                list-style-type: none;
                text-align: right;
                font-size: calc(var(--cover-font-size) * .6);
              }
            }

            .name {
              width: calc(v-bind(albumNameWidth) * 1%);
              position: absolute;
              bottom: 0;
              right: 0;
              font-size: calc(var(--cover-font-size) * v-bind(albumNameSize));
              text-align: right;
              text-wrap: balance;
              line-height: 0.85;
              border-radius: 8px;
              outline: 4px crimson;
              outline-offset: 4px;
            }
          }
        }
      }

      &.right {
        min-width: 320px;
        flex-direction: column;
        gap: 8px;

        h2 {
          text-align: center;
          user-select: none;
        }

        > div {
          display: flex;
          flex-direction: column;
          gap: 4px;
          color: var(--color-text-secondary);

          &, button, input {
            border: none;
            border-radius: 16px;
            corner-shape: superellipse(1.6);
          }

          &.album-display {
            height: 56px;
            flex-direction: row;
            gap: 8px;
            background-color: var(--color-bg-tertiary);
            padding: 8px;
            margin-top: auto;

            > div {
              height: 100%;
              display: flex;
              flex-direction: column;
              justify-content: center;

              &:has(img) { width: 56px; }
              &:has(span) { max-width: 240px; }

              img {
                height: 100%;
                border-radius: 8px;
                corner-shape: superellipse(1.6);
              }

              span {
                white-space: nowrap;
                text-overflow: ellipsis;
                overflow: hidden;

                &.title {
                  font-size: 24px;
                  font-weight: 700;
                }
              }
            }
          }

          &.export {
            flex-direction: row;
            align-items: center;
            gap: 8px;
            user-select: none;
            span { margin-right: auto; }

            button {
              display: flex;
              align-items: center;
              gap: 4px;
              background-color: var(--color-bg-quaternary);
              font-size: 16px;
              padding: 4px 8px;
              cursor: pointer;
              transition: background-color 200ms, scale 200ms;
              &:hover { background-color: hsl(from var(--color-bg-quaternary) h s calc(l * 1.25)); }
              &:active { scale: 0.9; }
              svg { stroke: var(--color-text-secondary) }
            }
          }

          label { user-select: none; }

          input[type=text] {
            font-size: 14px;
            background-color: var(--color-bg-tertiary);
            padding: 8px;
          }

          > div:has(input[type=color]) {
            width: 100%;
            display: flex;
            gap: 4px;
          }

          input[type=color] {
            height: 48px;
            width: 48px;

            &::-webkit-color-swatch-wrapper {
              border: none;
              padding: 0;
            }

            &::-webkit-color-swatch { border: none; }
          }
        }
      }
    }
  }
}
</style>