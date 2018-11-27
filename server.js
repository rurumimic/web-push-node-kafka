const Koa = require('koa');
const app = new Koa();
const serve = require('koa-static');
const path = require('path');
const kafka = require('kafka-node');
const bodyParser = require('koa-bodyparser');
const Router = require('koa-router');
const router = new Router();

const webpush = require('web-push');

const publicVapidKey = 'BIxeru5kL-OXk3YtHVylXI-gemgilsoesL80YEKb_P9v5Y77Buh8afeZgP8-PbQErv8X5TQ9qwl97mJK8_wtlSs';
const privateVapidKey = 'qkxmH3zHvdhTbAyk__ty05PDePJtC6Nzko3zpzHKE5k';

webpush.setVapidDetails('mailto:sample@email.net', publicVapidKey, privateVapidKey);

const Producer = kafka.Producer;
const Consumer = kafka.Consumer;
const client = new kafka.KafkaClient({kafkaHost: '127.0.0.1:9092'});
const producer = new Producer(client);
const consumer = new Consumer(
  client,
  [
    { topic: 'topic-test', partition: 0 }
  ],
  {
    autoCommit: false
  }
);

app.use(serve(path.join(__dirname, '/client')));

// Consumer
consumer.on('message', function (message) {

  console.log('Message is: ', message);

  // message value == subscription
  // payload = { body: subscription }
  const payload = JSON.stringify({ body: message.value });

  webpush.sendNotification(JSON.parse(message.value), payload).catch(error => {
    console.error(error.stack);
  });

});

consumer.on('offsetOutOfRange', function (topic) {
  topic.maxNum = 2;
  offset.fetch([topic], function (err, offsets) {
    if (err) {
      return console.error(err);
    }
    var min = Math.min.apply(null, offsets[topic.topic][topic.partition]);
    consumer.setOffset(topic.topic, topic.partition, min);
  });
});

consumer.on('error', function (err) {
  console.log('Consumer Error', err);
});

// Producer
producer.on('error', function (err) {
  console.log('Producer Error', err);
});

// API
router.post(
  '/subscribe',
  async ctx => {

    const subscription = ctx.request.body.subscription;
    const broswer = ctx.request.body.broswer;

    ctx.status = 201;

    const message = JSON.stringify(subscription);

    producer.send([
      { topic: 'topic-test', partition: 0, messages: message, attributes: 0 }
    ], function (err, result) {
      console.log('Produce Result: ', err || result);
    });

    console.log(subscription);
    console.log(broswer);
  }
);

// Bodyparser
app.use(bodyParser());

// Router
app.use(router.routes());
app.use(router.allowedMethods());

// Run server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server run in ` + process.env.NODE_ENV + ` mode.`);
});
