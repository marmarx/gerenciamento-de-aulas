<script setup>
import { useNotificationStore } from '@/modules/notifications/notificationStore'
useNotificationStore()

// testing
import { testNotification } from '@/modules/notifications/notificationMain'
await testNotification()
</script>