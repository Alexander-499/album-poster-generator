<script setup>
import { snapdom } from "@zumer/snapdom";
import { ref } from "vue";
import { chunkedTracks, formatDate, formatTime, formatArtists } from "@/scripts/utils.js"

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
const albumError = ref(null);
const cover = ref(null);

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
      printWindow.document.head.appendChild(Object.assign(printWindow.document.createElement("style"), { textContent: css }));
      printWindow.document.body.appendChild(Object.assign(printWindow.document.createElement("img"), { src: img.src }));
      printWindow.onload = () => printWindow.print();
    }
  } catch (error) {
    console.error('Screenshot failed:', error);
  }
}

async function generateAlbum(customId) {
  const id = customId || albumId.value.replace(/\?(.*)/, "").replace(/(.*)\//g, "");
  if (!id || id.length !== 22) return;
  const url = import.meta.env.PROD ? `/album/${id}` : `https://album-poster-generator.netlify.app/album/${id}`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error with status: ${response.status}`)
    const data = await response.json();
    console.log("Album:", data);
    albumData.value = data;
  } catch (error) {
    console.error(error);
    albumError.value = error || null;
  }
}

generateAlbum("2uKD5g5T7oklsMHJDcPgLB"); // Pashanim: 2000
// generateAlbum("5TBmws55nbERqZgYuoY4uB"); // Pashanim: junge ceos 1
</script>

<template>
  <main>
    <header>
      <h1>🖼️🎵 Album Poster Generator</h1>
    </header>
    <div class="center">
      <div class="left">
        <div ref="cover" class="cover">
          <template v-if="albumData">
            <span class="artist">{{ formatArtists(albumData.artists.map(a => a.name)) }}</span>
            <img class="cover-art" :src="albumData.images[0].url">
            <div class="bottom">
              <div class="songs">
                <ol v-for="(chunkTracks, i) in chunkedTracks(albumData, albumSongsPerColumn)" :key="i">
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
          </template>
          <span v-else class="error">
            <details>
              <summary>Unable to generate Album: {{ albumError?.message || "Unknown Error" }}</summary>
              {{ albumError?.stack || "Unknown" }}
            </details>
          </span>
        </div>
      </div>
      <div class="right">
        <h2>Options</h2>
        <Option title="Spotify Album URL/ID" for="albumIdInput"><input v-model="albumId" id="albumIdInput" type="text" placeholder="2uKD5g5T7oklsMHJDcPgLB" @input="generateAlbum()"></Option>
        <Option :title="`Songs Size (${albumSongsSize})`" for="albumSongsSizeInput"><input v-model="albumSongsSize" id="albumSongsSizeInput" type="range" min="0.4" max="1" step="0.01"></Option>
        <Option :title="`Songs Offset (${albumSongsOffset})`" for="albumSongsOffsetInput"><input v-model="albumSongsOffset" id="albumSongsOffsetInput" type="range" min="-0.15" max="0.05" step="0.01"></Option>
        <Option :title="`Songs Width (${albumSongsWidth})`" for="albumSongsWidthInput"><input v-model="albumSongsWidth" id="albumSongsWidthInput" type="range" min="0.1" max="0.7" step="0.01"></Option>
        <Option :title="`Songs per Column (${albumSongsPerColumn})`" for="albumSongsPerColumnInput"><input v-model="albumSongsPerColumn" id="albumSongsPerColumnInput" type="range" min="5" max="20"></Option>
        <Option title="Colors"><div><input v-for="(color, i) in albumColors" :key="i" v-model="albumColors[i]" type="color"></div></Option>
        <Option title="Genre" for="albumGenreInput"><input v-model="albumGenre" id="albumGenreInput" type="text" placeholder="Hip-Hop/Rap"></Option>
        <Option :title="`Name Size (${albumNameSize})`" for="albumNameSizeInput"><input v-model="albumNameSize" id="albumNameSizeInput" type="range" min="1" max="6" step="0.1"></Option>
        <Option :title="`Name Width (${albumNameWidth})`" for="albumNameWidthInput"><input v-model="albumNameWidth" id="albumNameWidthInput" type="range"></Option>
        <div class="spacer"></div>
        <div v-if="albumData" class="album-display">
          <div><img :src="albumData?.images[0].url"></div>
          <div>
            <span class="title">{{ albumData.name }}</span>
            <span class="artist">{{ formatArtists(albumData.artists.map(a => a.name)) }}</span>
          </div>
        </div>
        <Option :title="`Size (${albumExportSize} &times; ~${Math.floor(albumExportSize * Math.SQRT2)} px, A4, ~${Math.round(albumExportSize / (21 / 2.54))} DPI)`" for="albumExportSizeInput">
          <input v-model="albumExportSize" id="albumExportSizeInput" type="range" min="960" max="6720" step="480">
        </Option>
        <Option class="export" title="Export">
          <button title="Download PNG" @click="takeScreenshot('download', 'png')"><IconDownload/>PNG</button>
          <button title="Download SVG" @click="takeScreenshot('download', 'svg')"><IconDownload/>SVG</button>
          <button title="Download PNG" @click="takeScreenshot('print')"><IconPrinter/>Print</button>
        </Option>
      </div>
    </div>
    <footer>
      <div>
        <a href="https://alexander499.de" target="_blank">Alexander499</a>
        <a href="https://github.com/Alexander-499/album-poster-generator" target="_blank">GitHub</a>
        <a href="https://ko-fi.com/Alexander499" target="_blank">Donate</a>
      </div>
      <small>Album art/data is fetched from Spotify and remains the property of their respective copyright holders; this tool is for personal, non-commercial use and is not affiliated with or endorsed by Spotify.</small>
    </footer>
  </main>
</template>

<style scoped>
main {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  
  @media (width > 880px) { justify-content: center; }
  @media (width <= 880px) { padding: 24px 0; }

  header {
    text-align: center;
    user-select: none;
  }

  .center {
    display: flex;
    gap: 12px;
    z-index: 1;

    @media (width <= 880px) { flex-direction: column; }

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

        @media (width <= 520px) { --cover-width: min(400px, 85vw); }

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

          span.error {
            font-family: Inter;
            word-break: break-all;
            overflow-y: auto;
            summary { user-select: none; }
          }

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

          &.spacer { margin-top: auto; }

          &.album-display {
            height: 56px;
            flex-direction: row;
            gap: 8px;
            background-color: var(--color-bg-tertiary);
            padding: 8px;

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
            &:deep(span) { margin-right: auto; }

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

  footer {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;

    &, a { color: var(--color-text-secondary); }

    small {
      width: 480px;
      font-size: 11px;
      text-align: center;
      text-wrap: balance;
    }

    div {
      display: flex;
      gap: 8px;
    }
  }
}
</style>