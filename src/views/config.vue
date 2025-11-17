<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()

import inputToggle from '@/components/inputToggle.vue'
import { useDataStore } from "@/stores/dataStore"
const dataStore = useDataStore()

import { useAgendaStore } from '@/stores/agendaStore'
const agendaStore = useAgendaStore()

import { ref } from 'vue'
const fileInput = ref(null)

const copyToClipboard = async () => {
  try {await navigator.clipboard.writeText('c8a13647-4a71-44b1-967a-259079645ace'); alert("Chave Pix copiada para a área de transferência!")}
  catch (err) {("Failure: " + err)}
}

const importAction = (ev) => {
  dataStore.importData(ev, () => {
    agendaStore.generateEvents()
    router.push('/agenda')
  })
}

import { currency } from '@/stores/utility'
import { isInstalled, isIOS, isWeb, installApp } from "@/stores/installPWA.js"
</script>

<template>
  <div class="section">

    <h2>Configurações</h2>
    <div class="flexContainer mw500" style="max-width: 500px">

      <label class="inline-label">
        <span>
          <p class="title">Período de envio de notificações</p>
          <p class="helpText">Se permitido, notificações serão enviadas por padrão com {{dataStore.data.config.minutesBefore}} minuto{{dataStore.data.config.minutesBefore==1?'':'s'}} de antecedência</p>
        </span>
        <input class="tac" type="Number" min="0" max="120" step="5" placeholder="Minutos" v-model.number="dataStore.data.config.minutesBefore">
      </label>

      <inputToggle v-model="dataStore.data.config.autoCreateEvents">
        <template #title>Criar agendamentos recorrentes</template>
        <template #helpText>Aulas semanais {{ dataStore.data.config.autoCreateEvents?'':'não ' }} serão criadas automaticamente considerando o horário de cada aluno - você ainda poderá editar, cancelar e adicionar aulas manualmente</template>
      </inputToggle>

      <label class="inline-label">
        <span>
          <p class="title">Dias na agenda</p>
          <p class="helpText">Serão exibidos {{dataStore.data.config.numberOfDays}} dia{{dataStore.data.config.numberOfDays==1?'':'s'}} futuros na agenda</p>
        </span>
        <input class="tac" type="Number" min="0" step="1" placeholder="Dias" v-model.number="dataStore.data.config.numberOfDays">
      </label>

      <label class="inline-label">
        <span>
          <p class="title">Duração das aulas</p>
          <p class="helpText">As aulas terão {{dataStore.data.config.defaultClassDuration}} hora{{dataStore.data.config.defaultClassDuration==1?'':'s'}} de duração padrão, caso não especificado individualmente em cada evento - não afeta aulas existentes (passadas e agendadas)</p>
        </span>
        <input class="tac" type="Number" min="0" step=".25" placeholder="Horas" v-model.number="dataStore.data.config.defaultClassDuration">
      </label>

      <label class="inline-label">
        <span>
          <p class="title">Valor das aulas</p>
          <p class="helpText">O valor hora aula de {{ currency(dataStore.data.config.defaultClassCost) }} será utilizado como padrão, caso não especificado individualmente em cada aluno ou cada aula - não afeta alunos ou aulas existentes (passadas e agendadas)</p>
        </span>
        <input class="tac" type="Number" min="0" step=".05" placeholder="R$" v-model.number="dataStore.data.config.defaultClassCost">
      </label>

      <inputToggle v-model="dataStore.data.config.variableCost">
        <template #title>Valor unitário</template>
        <template #helpText>O valor das aulas {{dataStore.data.config.variableCost?'':'in'}}depende da respectiva duração, ou seja, elas tem valor {{dataStore.data.config.variableCost?'variável':'fixo'}}.</template>
      </inputToggle>

      <inputToggle v-model="dataStore.data.config.autoFinishEvents">
        <template #title>Finalizar aulas automaticamente</template>
        <template #helpText>Aulas agendadas {{ dataStore.data.config.autoFinishEvents?'':'não ' }}serão automaticamente marcadas como aulas dadas quando sua respectiva data chegar</template>
      </inputToggle>

      <label class="inline-label">
        <span>
          <p class="title">Período de finalização</p>
          <p class="helpText">As aulas serão automaticamente marcadas como aulas dadas {{ dataStore.data.config.autoFinishOffset }} minuto{{dataStore.data.config.autoFinishOffset>0?'s':''}} após o horário agendado de cada aula</p>
        </span>
        <input class="tac" type="Number" min="0" max="120" step="5" placeholder="Minutos" v-model.number="dataStore.data.config.autoFinishOffset">
      </label>

      <inputToggle v-model="dataStore.data.config.autoRemovePastEvents">
        <template #title>Remover aulas automaticamente</template>
        <template #helpText>Aulas passadas não finalizadas (agendas ou canceladas) {{ dataStore.data.config.autoRemovePastEvents?'':'não ' }}serão removidas da lista de todas as aulas (pode reduzir o uso de memória)</template>
      </inputToggle>

      <label class="inline-label">
        <span>
          <p class="title">Cor preferida</p>
          <p class="helpText">Escola a cor utilizada na interface do aplicativo, sinta-se a vontade para customizar</p>
        </span>
        <input type="color" v-model="dataStore.data.config.color">
      </label>

    </div>

    <hr/>

    <div class="flexContainer mw500">
      <h3>Exportar tabelas</h3>
      <p class="justify">Utilize a opção a seguir para exportar todos os dados para uma planilha que pode ser aberta utilizando Google Sheets, Microsoft Excel ou outro aplicativo de sua preferência.</p>
      <button @click="dataStore.exportTables()">Exportar tabelas</button>
    </div>

    <hr/>

    <div class="flexContainer mw500">
      <h3>Gerenciar dados</h3>
      <p class="justify">Todos os dados são armazenados <b>apenas</b> localmente neste dispositivo, ou seja, nada é armazenado online ou em outro dispositivo.</p>
      <p class="justify">Use as opções <b>importar</b> e <b>exportar</b> para transferir seu personagem entre dispositivos.</p>
      <p class="justify mb">Para exluir todos os dados, por favor, utilize o botão a seguir. Os dados <b>não</b> poderão ser recuperados.</p>

      <button @click="dataStore.exportData()">Exportar dados</button>
      <input type="file" ref="fileInput" style="display:none" @change="importAction($event)" accept=".json" />
      <button @click="fileInput.click()">Importar dados</button>
      <button @click="dataStore.clearStorage()">Apagar dados</button>
    </div>

    <hr/>

    <div class="flexContainer mw500">
      <h3>Sobre o aplicativo</h3>
      <p class="justify">Este aplicativo é desenvolvido de forma independente e é disponibilizado gratuitamente.</p>

      <template v-if="!isInstalled && isWeb">
        <p class="justify">Você pode utilizar esse aplicativo offline, para isso instale-o no seu celular, tablet ou computador.</p>
        <p class="justify" v-if="isIOS">Para instalar, clique em "Compartilhamento" e depois em "Adicionar à tela inicial".</p>
        <button v-else @click="installApp()">Instalar App</button>
        <p class="justify">Para receber notificações em um celular ou tablet, é necessário instalar à partir da <a target="_blank" href="https://play.google.com/store/apps">Google Play Store</a> ou da <a target="_blank" href="https://apple.com/br/app-store/">Apple App Store</a>, podem haver cobranças.</p>
      </template>

      <div class="flexContainer mw500">
        <p class="justify">Se desejar suportar o desenvolvimento, fique a vontade para fazer doações por Pix.</p>
        <button @click="copyToClipboard()">Copiar Chave Pix</button>
      </div>

      <hr/>
      <p class="justify">v 1.4.0 - 2025.11.17</p>
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

<style scoped>
hr{width:80%; max-width:450px; margin:25px auto}
</style>