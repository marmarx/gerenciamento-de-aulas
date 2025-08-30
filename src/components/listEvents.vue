<script setup>
const props = defineProps({listOfEvents:{type:Object,required:true}})

const cardDetails = (date, time) => `Hoje/Amanhã/25 de ago  •  Qui  •  01h30`
</script>

<template>
  <div class="container grid">
    <div class="card-event" v-for="event in listOfEvents" :key="event.idEv">
      <div class="card-name">
        {{event.student_name}}
        <!-- <div class="card-ampel" style="color:#49e048;"></div> -->
      </div>
      <div class="card-details">{{cardDetails(event.date,event.time)}}</div>
      <div class="card-btns">
        <div class="card-btn" onclick="editExtra('st_e312c0bb-e323-4782-8b9b-2ecadfd4b3f4')">Editar</div>
        <a class="card-btn noround" href="https://google.com/maps/dir/?api=1&amp;destination=Sanca" target="_blank" rel="noopener noreferrer">Maps</a>
        <a class="card-btn" href="https://wa.me/" target="_blank" rel="noopener noreferrer">Whatsapp</a>
      </div>
    </div>
  </div>
  
</template>

<style>
.grid{ display: grid; grid-template-columns: repeat(auto-fill,minmax(240px,1fr)); gap: 14px }
.card-event{
  display:flex; flex-direction:column; min-height:132px; 
  border:1px solid var(--card-br); border-radius:14px;
  background:var(--card-bg); box-shadow:0 1px 2px rgba(0,0,0,.04);
}
.partiallyVisible{opacity:.5}
.card-ampel{ width: 8px; height: 8px; border-radius: 100%; background: currentColor }
.card-name{display:inline-flex; justify-content:space-between; font-weight:600; font-size:1.05rem; word-break:break-word;padding:22px 18px 12px}
.card-details{font-size:.98rem; color:var(--accent); display:flex; align-items:center; gap:8px;padding:0 18px 12px; white-space:pre}
.card-details:nth-child(3){padding-bottom:22px}
.card-btns{ display:inline-flex; margin-top:auto; border-top:1px solid var(--card-br) }
.card-btn{
  width: 100%;
  padding:10px 0; border:0; border-right:1px solid var(--btn-br);
  font-weight:600; color: var(--white); text-align:center; text-decoration: none;
  appearance: none; cursor:pointer; background:var(--black-main);
}
.card-btn:hover{background:var(--black-washed)}
.card-btn:first-child{border-radius: 0 0 0 14px}
.card-btn:last-child{border-right:0;border-radius: 0 0 14px 0}
</style>