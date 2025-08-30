<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()

import inputToggle from '@/components/inputToggle.vue'
import { useDataStore } from "@/stores/datastore"
const dataStore = useDataStore()

import { ref } from 'vue'
const fileInput = ref(null)

import "@/stores/color"

const copyToClipboard = async () => {
  try {await navigator.clipboard.writeText('c8a13647-4a71-44b1-967a-259079645ace'); alert("Chave Pix copiada para a área de transferência!")}
  catch (err) {console.log("Failure: " + err)}
}
</script>

<template>  
  <div class="section">

    <h2>Configurações</h2>
    <div class="flexContainer mw500" style="max-width: 500px">
      <label class="inline-label">
        <span>
          <p class="title">Dias na agenda</p>
          <p class="helpText">Número de dias futuros que serão exibidos na agenda</p>
        </span>
        <input class="tac" type="Number" min="0" step="1" placeholder="Dias na agenda" v-model.number="dataStore.data.config.numberOfDays">
      </label>

      <label class="inline-label">
        <span>
          <p class="title">Duração das aulas</p>
          <p class="helpText">A duração padrão das aulas em horas será utilizado automaticamente quando não for especificado</p>
        </span>
        <input class="tac" type="Number" min="0" step=".25" placeholder="Duração das aulas (horas)" v-model.number="dataStore.data.config.defaultClassDuration">
      </label>

      <inputToggle v-model="dataStore.data.config.autoFinishEvents">
        <template #title>Finalizar aulas automaticamente</template>
        <template #helpText>Aulas agendadas serão marcadas como aulas dadas automaticamente quando sua respectiva data chegar</template>
      </inputToggle>

      <inputToggle v-model="dataStore.data.config.autoRemovePastEvents">
        <template #title>Remover aulas automaticamente</template>
        <template #helpText>Aulas passadas não finalizadas serão removidas automaticamente</template>
      </inputToggle>

      <label class="inline-label">
        <span>
          <p class="title">Cor primária</p>
          <p class="helpText">Cor utilizada na interface do aplicativo, sinta-se a vontade para customizar</p>
        </span>
        <input type="color" v-model="dataStore.data.config.color1">
      </label>

      <label class="inline-label">
        <span>
          <p class="title">Cor secundária</p>
          <p class="helpText">Cor utilizada na interface do aplicativo, sinta-se a vontade para customizar</p>
        </span>
        <input type="color" v-model="dataStore.data.config.color2">
      </label>
    </div>

    <hr style="width:80%; max-width:450px" />

    <div class="flexContainer mw500">
      <h3>Sobre o aplicativo</h3>
      <p class="justify">Este aplicativo é desenvolvido por <a href="https://github.com/marmarx/marmarx.github.io/" target="_blank" rel="noopener">Marco Martins</a> de forma independente e está disponível gratuitamente no GitHub.</p>
      <p class="justify">Você pode utilizar esse aplicativo offline, se desejar instale-o no seu celular, tablet ou computador. Veja o <a href="https://support.google.com/chrome/answer/9658361" target="_blank" rel="noopener">suporte Google</a> para instruções detalhadas.</p>
      <p class="justify">Se desejar suportar o desenvolvimento, fique a vontade para fazer doações por Pix.</p>
      <button @click="copyToClipboard()">Copiar Chave Pix</button>
    </div>

    <hr style="width:80%; max-width:450px" />

    <div class="flexContainer mw500">
      <h3>Gerenciar dados</h3>
      <p class="justify">Todos os dados são armazenados <b>apenas</b> localmente neste dispositivo, ou seja, nada é armazenado online ou em outro dispositivo.</p>
      <p class="justify">Use as opções <b>importar</b> e <b>exportar</b> para transferir seu personagem entre dispositivos.</p>
      <p class="justify mb">Caso deseje exluir todos os dados, por favor, utilize o botão a seguir. Eles <b>não</b> poderão ser recuperados.</p>

      <button @click="dataStore.exportStorage()">Exportar dados</button>
      <input type="file" ref="fileInput" style="display:none" @change="dataStore.importStorage($event);router.push('/agenda')" accept=".json" />
      <button @click="fileInput.click()">Importar dados</button>
      <button @click="dataStore.clearStorage()">Apagar dados</button>
    </div>
    
  </div>
</template>

<style>
.mw500 {max-width:500px}
.inline-label{ width: 100%; display: flex; flex-direction: row; flex-wrap: nowrap; align-items: center; justify-content: space-around; gap: 2em; }
.inline-label input{margin: 0}
.inline-label > *:first-child{width:80%}
.inline-label > *:last-child{width:20%}

span p{ font-size: 1.1em; margin: .5em 0; font-weight: normal; user-select: none }
span p.title { font-weight: bold }
span p.helpText { font-size: 1em; opacity: .9; }

input[type="color"]{ border:0; padding: 0; width: 2.5em; height: 2.5em; cursor: pointer; }
p.justify{text-align: justify; line-height: 1.6em; margin: .5em}
p.justify.mb{margin-bottom: 2em}
</style>