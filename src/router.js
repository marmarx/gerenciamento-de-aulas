import { createRouter, createWebHistory } from 'vue-router'
import Agenda from '@/views/agenda.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/',                  name: 'Agenda',          component: Agenda,                                    alias: ['/agenda'] },
    { path: '/alunos',            name: 'Alunos',          component: () => import('@/views/alunos.vue'),        alias: [] },
    { path: '/panorama',          name: 'Panorama',        component: () => import('@/views/panorama.vue'),      alias: [] },
    { path: '/aluno',             name: 'Aluno detalhes',  component: () => import('@/views/aluno.vue'),         alias: [] },
    { path: '/aluno/editar',      name: 'Aluno editar',    component: () => import('@/views/alunoEditar.vue'),   alias: [] },
    { path: '/aula',              name: 'Aula nova',       component: () => import('@/views/aulaNova.vue'),      alias: ['/aula'] },
    { path: '/aula/editar',       name: 'Aula editar',     component: () => import('@/views/aulaEditar.vue'),    alias: ['/aula/edit'] },
    { path: '/aulas',             name: 'Aulas',           component: () => import('@/views/aulas.vue'),         alias: ['/aulas-dadas'] },
    { path: '/agendamento',       name: 'Agendamento',     component: () => import('@/views/agendamento.vue'),   alias: [] },
    { path: '/pagamento',         name: 'Pagamento',       component: () => import('@/views/pagamento.vue'),     alias: [] },
    { path: '/extrato',           name: 'Extrato',         component: () => import('@/views/extrato.vue'),       alias: ['/statement'] },
    { path: '/relatorio',         name: 'Relatório',       component: () => import('@/views/relatorio.vue'),     alias: ['/report'] },
    { path: '/config',            name: 'Configurações',   component: () => import('@/views/config.vue'),        alias: ['/configuracoes', '/configuracao'] },
    { path: '/test',              name: 'Teste Env',       component: () => import('@/views/test.vue'),       },
  ],
})

export default router