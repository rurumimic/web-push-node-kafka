console.log('Loaded service worker!');

self.addEventListener('push', ev => {
  const data = ev.data.json();
  console.log('Got push', data);

  self.registration.showNotification('Push Title', {
    body: data.body,
    icon: './fuckyeahpicard@2x.png'
  });
});
