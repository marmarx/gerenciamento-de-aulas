<script setup>
import inputToggle from '@/modules/inputs/inputToggle.vue'
import inputHelp from '@/modules/inputs/inputHelp.vue'

import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDataStore } from "@/stores/dataStore"
import { useAgendaStore } from '@/stores/agendaStore'

import { toastShow } from '@/modules/toast/toastShow'
import { currency, formatDuration } from '@/composables/utility'
import { isInstalled, isIOS, isWeb, installApp } from "@/modules/PWA/installPWA.js"
import { permissionGranted, checkPermission } from '@/modules/notifications/notificationMain'

const router = useRouter()
const dataStore = useDataStore()
const agendaStore = useAgendaStore()
const fileInput = ref(null)

const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText('c8a13647-4a71-44b1-967a-259079645ace')
    toastShow('Copiado!',"Chave Pix copiada para a área de transferência")
  } catch (err) {("Failure: " + err)}
}

const importAction = (ev) => {
  dataStore.importData(ev, () => {
    agendaStore.generateEvents()
    router.push('/agenda')
  })
}

onMounted(() => checkPermission())

</script>

<template>
  <div class="section">

    <div class="flexContainer mw500" style="max-width: 500px">
      <h2>Configurações</h2>
      <p>Fique a vontade para ajustar as configurações abaixo conforme as suas necessidades.</p>
    </div>
    <hr/>

    <div class="flexContainer mw500">

      <h3>Agenda</h3>
      <inputHelp id="daysAgenda" placeholder="Dias" :numberDefs="{min: 0, step: 1}" v-model.number="dataStore.data.config.numberOfDays">
        <template #title>Dias na agenda</template>
        <template #helpText>
          {{ dataStore.data.config.numberOfDays
            ? `Serão exibidos ${dataStore.data.config.numberOfDays} dia${dataStore.data.config.numberOfDays==1?'':'s'} futuros na agenda`
            : 'Apenas o dia de hoje será exibido na agenda'}}
        </template>
      </inputHelp>

      <inputToggle v-model="dataStore.data.config.autoCreateEvents">
        <template #title>Criar agendamentos recorrentes</template>
        <template #helpText>
          Aulas semanais {{ dataStore.data.config.autoCreateEvents?'':'não ' }} 
          serão criadas automaticamente considerando o horário de cada aluno - você ainda poderá editar, cancelar e adicionar aulas manualmente
        </template>
      </inputToggle>

      <inputToggle v-model="dataStore.data.config.autoFinishEvents">
        <template #title>Finalizar aulas automaticamente</template>
        <template #helpText>
          Aulas agendadas {{ dataStore.data.config.autoFinishEvents?'':'não ' }}
          serão automaticamente marcadas como aulas dadas quando sua respectiva data chegar
        </template>
      </inputToggle>

      <inputHelp id="autoFinish" placeholder="Min" :numberDefs="{min: 0, max:120, step: 5}" v-model.number="dataStore.data.config.autoFinishOffset">
        <template #title>Período de finalização</template>
        <template #helpText>
          As aulas serão automaticamente marcadas como aulas dadas 
          {{ dataStore.data.config.autoFinishOffset ? `${formatDuration(dataStore.data.config.autoFinishOffset/60)} após o` : 'no' }}
           horário agendado de cada aula
        </template>
      </inputHelp>

      <inputToggle v-if="!dataStore.data.config.autoFinishEvents" v-model="dataStore.data.config.autoRemovePastEvents">
        <template #title>Remover aulas automaticamente</template>
        <template #helpText>
          Aulas passadas agendadas (não finalizadas manualmente) serão 
          {{ dataStore.data.config.autoRemovePastEvents
            ? `removidas automaticamente da agenda ${formatDuration(dataStore.data.config.removalGraceHours)} após seu horário`
            : 'mantidas indefinidamente na agenda - você ainda poderá remove-las manualmente' }} 
        </template>
      </inputToggle>

    </div>
    <hr/>
    <div class="flexContainer mw500">

      <h3>Aulas</h3>
      <inputToggle v-model="dataStore.data.config.variableCost">
        <template #title>Valor unitário {{dataStore.data.config.variableCost?'variável':'fixo'}}</template>
        <template #helpText>
          O valor de cada aula {{dataStore.data.config.variableCost?'':'in'}}
          depende da respectiva duração, ou seja, elas tem valor {{dataStore.data.config.variableCost?'variável':'fixo'}}
        </template>
      </inputToggle>

      <inputHelp id="duration" placeholder="Horas" :numberDefs="{min: .25, step: .25}" v-model.number="dataStore.data.config.duration">
        <template #title>Duração das aulas</template>
        <template #helpText>
          As aulas terão {{ formatDuration(dataStore.data.config.duration) }}
          de duração padrão, caso não especificado individualmente em cada evento - afeta apenas novos alunos
        </template>
      </inputHelp>

      <inputHelp id="cost" :placeholder="`${currency(0).slice(0,2)}${dataStore.data.config.variableCost?'/h':''}`" :numberDefs="{min: 0, step: .5}" v-model.number="dataStore.data.config.cost">
        <template #title>Valor das aulas</template>
        <template #helpText>
          O valor {{dataStore.data.config.variableCost ? 'hora' : 'da'}} aula de {{ currency(dataStore.data.config.cost) }}
          será utilizado como padrão - afeta apenas novos alunos
        </template>
      </inputHelp>

    </div>
    <hr/>
    <div class="flexContainer mw500">

      <h3>Política de cancelamento</h3>
      <inputToggle v-model="dataStore.data.config.chargeCancelations">
        <template #title>Cancelamentos {{ dataStore.data.config.chargeCancelations?'cobrados':'gratuitos' }}</template>
        <template #helpText>
          Aulas canceladas 
          {{ dataStore.data.config.chargeCancelations ? 'serão cobradas conforme o período de gratuidade e a taxa de cancelamento abaixo' : 'não serão cobradas' }} 
          por padrão - afeta apenas novos alunos
          </template>
      </inputToggle>

      <inputHelp id="freeBefore" :if="dataStore.data.config.chargeCancelations" placeholder="Horas" :numberDefs="{min: 0, step: .25}" v-model.number="dataStore.data.config.freeCancelationBefore">
        <template #title>Período de gratuidade</template>
        <template #helpText>
          Não serão cobrados cancelamentos que ocorram 
          {{ dataStore.data.config.freeCancelationBefore ? `com no mínimo ${formatDuration(dataStore.data.config.freeCancelationBefore)} de antecedência` : 'até o horário da aula' }} 
          por padrão - afeta apenas novos alunos
        </template>
      </inputHelp>

      <inputHelp id="cancelFee" :if="dataStore.data.config.chargeCancelations" placeholder="%" :numberDefs="{min: 0, max: 200, step: 5}" v-model.number="dataStore.data.config.cancelationFee">
        <template #title>Taxa de cancelamento</template>
        <template #helpText>
          {{dataStore.data.config.cancelationFee
            ? `Cancelamentos que ocorram após o período de gratuidade, serão cobrados em ${dataStore.data.config.cancelationFee}% do valor da aula`
            : 'Cancelamentos são gratuitos'}} por padrão - afeta apenas novos alunos
        </template>
      </inputHelp>

    </div>
    <hr/>
    <div class="flexContainer mw500">

      <h3>Notificações</h3>

      <inputToggle v-model="permissionGranted" style="pointer-events: none">
        <template #title>Permitir notificações</template>
        <template #helpText>{{ permissionGranted ? 'O envio de notificações está permitido. Para desativar' : 'Para permitir' }}, por favor, abra as configurações do seu dispositivo.</template>
      </inputToggle>

      <inputHelp v-if="permissionGranted" id="minutesBefore" placeholder="Min" :numberDefs="{min: 0, max: 120, step: 5}" v-model.number="dataStore.data.config.minutesBefore">
        <template #title>Período de envio de notificações</template>
        <template #helpText>
          Se permitido, notificações serão enviadas por padrão {{dataStore.data.config.minutesBefore
            ? `com ${formatDuration(dataStore.data.config.minutesBefore/60)} de antecedência`
            : 'no horário de cada aula'}}
        </template>
      </inputHelp>

      <inputToggle v-if="permissionGranted" v-model="dataStore.data.config.notifyBirthday">
        <template #title>Notificar aniversários</template>
        <template #helpText>Notificações {{ dataStore.data.config.notifyBirthday ? '' : 'não ' }}dos aniversários de cada aluno serão enviadas às 9 horas da manhã do dia anterior.</template>
      </inputToggle>

    </div>
    <hr/>
    <div class="flexContainer mw500">

      <h3>Geral</h3>

      <inputHelp id="color" type="color" v-model.number="dataStore.data.config.color">
        <template #title>Cor preferida</template>
        <template #helpText>Escola a cor utilizada na interface do aplicativo, sinta-se a vontade para customizar</template>
      </inputHelp>

      <inputToggle v-model="dataStore.data.config.advancedOptions">
        <template #title>Aulas: opções avançadas</template>
        <template #helpText>Permite controlar a política de precificação e a política de cancelamento para cada aula individualmente.</template>
      </inputToggle>

      <inputToggle v-model="dataStore.data.config.canceledOnReport">
        <template #title>Relatório: aulas canceladas</template>
        <template #helpText>Aulas canceladas {{ dataStore.data.config.canceledOnReport ? '' : 'não ' }} serão mostradas no relatório.</template>
      </inputToggle>

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
      <p class="justify">v 1.5.0 - 2025.12.03</p>
    </div>
    
  </div>
</template>

<style>
.mw500 {max-width:500px}

span p{ font-size: 1em; margin: .5em 0; font-weight: normal; user-select: none }
span p.title { font-weight: bold; line-height: 1.1em }
span p.helpText { font-size: 1em; opacity: .9 }

input[type="color"]{ border:0; padding: 0; width: 2.5em; height: 2.5em; cursor: pointer; }
p.justify{text-align: justify; line-height: 1.6em; margin: .5em}
p.justify.mb{margin-bottom: 2em}
</style>

<style scoped>
hr{width:80%; max-width:450px; margin:25px auto}
.section{gap:.8em}
</style>