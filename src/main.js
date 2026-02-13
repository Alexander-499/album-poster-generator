import { createApp } from "vue";
import App from "./App.vue";
import * as LucideIcons from "lucide-vue-next";
import Option from "@/components/ui/Option.vue"
import "@/styles/general.css"

const app = createApp(App);
app.config.devtools = true;
for (const [name, component] of Object.entries(LucideIcons)) app.component(`Icon${name}`, component);
app.component("Option", Option);
app.mount('#app');