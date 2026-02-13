import { createApp } from "vue";
import App from "./App.vue";
import * as LucideIcons from "lucide-vue-next";
import "@/styles/general.css"

const app = createApp(App);
for (const [name, component] of Object.entries(LucideIcons)) app.component(`Icon${name}`, component);
app.mount('#app');