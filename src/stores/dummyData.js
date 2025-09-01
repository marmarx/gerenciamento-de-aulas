const dummyData =
  {
    students:[
      
      {
        id_student: 'student_3f760a1d-a8e3-40fe-9282-dd02401d56b8',
        added_on: new Date(),
        paused: false,
        student_name: 'Boreas',
        parent: 'Marco', parent_phone: '16 9 8765 4321',
        parent_2: 'Renata', parent_2_phone: '19 9 1234 5678',
        address: 'Saint Laurent',
        meeting: 'https://meet.google.com/txs-ktpc-eby',
        scholl: 'Viváqua', year: '9 ano',
        weekly_schedule: [{ weekDay: 2, timeDay: '16:00', subject: 'História' }, { weekDay: 4, timeDay: '17:45', subject: 'Inglês' }],
        cost: 75,
        start_date: '2025-08-15', end_date: '',
        obs: 'Bonzinho e carinhoso'
      },
      {
        id_student: 'student_ff8154a8-c5b1-471a-b12b-65ad444671ac',
        added_on: new Date(),
        paused: false,
        student_name: 'Aurora',
        parent: 'Beatriz', parent_phone: '27 9 9999 9999',
        parent_2: '', parent_2_phone: '',
        address: 'Av Eng',
        scholl: 'ASFA', year: '6 ano',
        weekly_schedule: [{ weekDay: 1, timeDay: '9:00', subject: 'Matemática' }, { weekDay: 3, timeDay: '10:15', subject: 'Português' }, { weekDay: 5, timeDay: '11:30', subject: 'Geografia' }],
        cost: 50,
        start_date: '2025-07-23', end_date: '',
        obs: 'Mia muito alto'
      },
    ],
    events:[],
    payments:[
      {
        id_pay: 'payment_95aba052-7781-432d-a73h-dc5492383189',
        added_on: new Date(),
        id_student: 'student_ff8154a8-c5b1-471a-b12b-65ad444671ac',
        date: '2025-08-24',
        value: 75,
        obs: ''
      }
    ],
    config: {
      numberOfDays: 14, defaultClassDuration: 1, defaultClassCost: 50,
      autoFinishEvents: false, autoRemovePastEvents: false, color: '#44289e',
    }
  }

export default dummyData;