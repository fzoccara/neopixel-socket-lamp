# Node.js WebSocket Example

This example accompanies the
[Using WebSockets on Heroku with Node.js](https://devcenter.heroku.com/articles/node-websockets)
tutorial.

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

<!-- #######  YAY, I AM THE SOURCE EDITOR! #########-->
<h1>Using WebSockets on Heroku with Node.js</h1>
<p class="last-updated">Last updated 15 November 2017</p>
<div id="table-of-contents">
<h3>Table of Contents</h3>
<ul>
<li><a href="https://devcenter.heroku.com/articles/node-websockets#create-a-new-app">Create a new app</a></li>
<li><a href="https://devcenter.heroku.com/articles/node-websockets#option-1-websocket">Option 1: WebSocket</a></li>
<li><a href="https://devcenter.heroku.com/articles/node-websockets#option-2-socket-io">Option 2: Socket.io</a></li>
</ul>
</div>
<p>This tutorial will get you going with realtime Node.js applications on Heroku. We&rsquo;ll develop a simple application that shares the server&rsquo;s current time with the client via a persistent socket connection. Each application will be based on node&rsquo;s popular&nbsp;<a href="http://expressjs.com/">express</a>&nbsp;web server.</p>
<p>When developing realtime Node.js applications, you can directly use WebSockets, or you can use an abstraction library like Socket.io which provides fallbacks for clients that don&rsquo;t support the WebSocket protocol. We&rsquo;ll demonstrate both options below.</p>
<h2 id="create-a-new-app"><a href="https://devcenter.heroku.com/articles/node-websockets#create-a-new-app">Create a new app</a></h2>
<p>Move into your app&rsquo;s directory and create a default package.json:</p>
<pre class=" language-term"><code class=" language-term"><span class="token input"><span class="token prompt">$ </span>npm init --yes</span>
</code></pre>
<p>Let&rsquo;s also specify a version of node in package.json and provide a mechanism for starting the app:</p>
<pre class=" language-json"><code class=" language-json"><span class="token property">"engines"</span><span class="token operator">:</span> <span class="token punctuation">{</span>
  <span class="token property">"node"</span><span class="token operator">:</span> <span class="token string">"6.2.0"</span>
<span class="token punctuation">}</span><span class="token punctuation">,</span>
<span class="token property">"scripts"</span><span class="token operator">:</span> <span class="token punctuation">{</span>
  <span class="token property">"start"</span><span class="token operator">:</span> <span class="token string">"node server.js"</span>
<span class="token punctuation">}</span>
</code></pre>
<h2 id="option-1-websocket"><a href="https://devcenter.heroku.com/articles/node-websockets#option-1-websocket">Option 1: WebSocket</a></h2>
<p>The simplest way to use WebSocket connections is directly through node&rsquo;s&nbsp;<a href="https://github.com/websockets/ws">ws module</a>. We&rsquo;ll walk through each step in setting up the app, but you can view the&nbsp;<a href="https://github.com/heroku-examples/node-websockets">full source on GitHub</a>.</p>
<h3 id="option-1-websocket-install-dependencies"><a href="https://devcenter.heroku.com/articles/node-websockets#option-1-websocket-install-dependencies">Install dependencies</a></h3>
<p>Let&rsquo;s start with a basic&nbsp;<a href="http://expressjs.com/">express</a>&nbsp;web server:</p>
<pre class=" language-term"><code class=" language-term"><span class="token input"><span class="token prompt">$ </span>npm install --save --save-exact express</span>
</code></pre>
<p>For WebSockets, we&rsquo;ll install the&nbsp;<a href="https://github.com/websockets/ws">ws</a>&nbsp;module as well as&nbsp;<a href="https://github.com/websockets/bufferutil">bufferutil</a>&nbsp;and&nbsp;<a href="https://github.com/websockets/utf-8-validate">utf-8-validate</a>. Only ws is necessary, but the other two provide&nbsp;<a href="https://github.com/websockets/ws#opt-in-for-performance-and-spec-compliance">a performance boost</a>.</p>
<pre class=" language-term"><code class=" language-term"><span class="token input"><span class="token prompt">$ </span>npm install --save --save-exact ws bufferutil utf-8-validate</span>
</code></pre>
<h3 id="option-1-websocket-create-an-http-server"><a href="https://devcenter.heroku.com/articles/node-websockets#option-1-websocket-create-an-http-server">Create an HTTP server</a></h3>
<p>We need an HTTP server to do two things: serve our client-side assets and provide a hook for the WebSocket server to monitor for upgrade requests.&nbsp;<a href="https://github.com/heroku-examples/node-websockets/blob/master/server.js">The code</a>&nbsp;looks something like this:</p>
<pre class=" language-js"><code class=" language-js"><span class="token keyword">const</span> server <span class="token operator">=</span> <span class="token function">express</span><span class="token punctuation">(</span><span class="token punctuation">)</span>
  <span class="token punctuation">.</span><span class="token function">use</span><span class="token punctuation">(</span><span class="token punctuation">(</span>req<span class="token punctuation">,</span> res<span class="token punctuation">)</span> <span class="token operator">=&gt;</span> res<span class="token punctuation">.</span><span class="token function">sendFile</span><span class="token punctuation">(</span>INDEX<span class="token punctuation">)</span> <span class="token punctuation">)</span>
  <span class="token punctuation">.</span><span class="token function">listen</span><span class="token punctuation">(</span>PORT<span class="token punctuation">,</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=&gt;</span> console<span class="token punctuation">.</span><span class="token function">log</span><span class="token punctuation">(</span><span class="token template-string"><span class="token string">`Listening on </span><span class="token interpolation"><span class="token interpolation-punctuation punctuation">${</span> PORT <span class="token interpolation-punctuation punctuation">}</span></span><span class="token string">`</span></span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
</code></pre>
<h3 id="create-a-websocket-server"><a href="https://devcenter.heroku.com/articles/node-websockets#create-a-websocket-server">Create a WebSocket server</a></h3>
<p>The WebSocket server takes an HTTP server as an argument so that it can listen for &lsquo;upgrade&rsquo; events:</p>
<pre class=" language-js"><code class=" language-js"><span class="token keyword">const</span> wss <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">SocketServer</span><span class="token punctuation">(</span><span class="token punctuation">{</span> server <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
</code></pre>
<h3 id="option-1-websocket-handle-connections"><a href="https://devcenter.heroku.com/articles/node-websockets#option-1-websocket-handle-connections">Handle connections</a></h3>
<p>Here, we&rsquo;ll listen for and log connections and disconnections. Once a client has connected, you can also add event handlers for messages from that client.&nbsp;<a href="https://github.com/heroku-examples/node-websockets/blob/master/server.js">The code</a>&nbsp;looks something like this:</p>
<pre class=" language-js"><code class=" language-js">wss<span class="token punctuation">.</span><span class="token function">on</span><span class="token punctuation">(</span><span class="token string">'connection'</span><span class="token punctuation">,</span> <span class="token punctuation">(</span>ws<span class="token punctuation">)</span> <span class="token operator">=&gt;</span> <span class="token punctuation">{</span>
  console<span class="token punctuation">.</span><span class="token function">log</span><span class="token punctuation">(</span><span class="token string">'Client connected'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  ws<span class="token punctuation">.</span><span class="token function">on</span><span class="token punctuation">(</span><span class="token string">'close'</span><span class="token punctuation">,</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=&gt;</span> console<span class="token punctuation">.</span><span class="token function">log</span><span class="token punctuation">(</span><span class="token string">'Client disconnected'</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
</code></pre>
<h3 id="option-1-websocket-broadcast-updates"><a href="https://devcenter.heroku.com/articles/node-websockets#option-1-websocket-broadcast-updates">Broadcast updates</a></h3>
<p>One of the benefits of socket connections is that your server can broadcast data to clients without waiting for client requests. In this case, we&rsquo;ll push the current time to all clients every second:</p>
<pre class=" language-js"><code class=" language-js"><span class="token function">setInterval</span><span class="token punctuation">(</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=&gt;</span> <span class="token punctuation">{</span>
  wss<span class="token punctuation">.</span>clients<span class="token punctuation">.</span><span class="token function">forEach</span><span class="token punctuation">(</span><span class="token punctuation">(</span>client<span class="token punctuation">)</span> <span class="token operator">=&gt;</span> <span class="token punctuation">{</span>
    client<span class="token punctuation">.</span><span class="token function">send</span><span class="token punctuation">(</span><span class="token keyword">new</span> <span class="token class-name">Date</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">toTimeString</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  <span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span><span class="token punctuation">,</span> <span class="token number">1000</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
</code></pre>
<h3 id="create-a-websocket-client"><a href="https://devcenter.heroku.com/articles/node-websockets#create-a-websocket-client">Create a WebSocket client</a></h3>
<p>Our client, index.html, is a simple page that listens for time updates from the server.&nbsp;<a href="https://github.com/heroku-examples/node-websockets/blob/master/index.html">The code</a>looks something like this:</p>
<pre class=" language-js"><code class=" language-js"><span class="token keyword">var</span> HOST <span class="token operator">=</span> location<span class="token punctuation">.</span>origin<span class="token punctuation">.</span><span class="token function">replace</span><span class="token punctuation">(</span><span class="token regex">/^http/</span><span class="token punctuation">,</span> <span class="token string">'ws'</span><span class="token punctuation">)</span>
<span class="token keyword">var</span> ws <span class="token operator">=</span> <span class="token keyword">new</span> <span class="token class-name">WebSocket</span><span class="token punctuation">(</span>HOST<span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token keyword">var</span> el <span class="token operator">=</span> document<span class="token punctuation">.</span><span class="token function">getElementById</span><span class="token punctuation">(</span><span class="token string">'server-time'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

ws<span class="token punctuation">.</span>onmessage <span class="token operator">=</span> <span class="token keyword">function</span> <span class="token punctuation">(</span>event<span class="token punctuation">)</span> <span class="token punctuation">{</span>
  el<span class="token punctuation">.</span>innerHTML <span class="token operator">=</span> <span class="token string">'Server time: '</span> <span class="token operator">+</span> event<span class="token punctuation">.</span>data<span class="token punctuation">;</span>
<span class="token punctuation">}</span><span class="token punctuation">;</span>
</code></pre>
<h3 id="option-1-websocket-start-the-app"><a href="https://devcenter.heroku.com/articles/node-websockets#option-1-websocket-start-the-app">Start the app</a></h3>
<p>You can now start and test the app locally at&nbsp;<a href="http://localhost:3000/">http://localhost:3000</a>:</p>
<pre class=" language-term"><code class=" language-term"><span class="token input"><span class="token prompt">$ </span>npm start</span>
<span class="token input"><span class="token prompt">&gt; </span>node server.js</span>

Listening on 3000
</code></pre>
<p>Once you&rsquo;re satisfied with the behavior, commit all your files to git (with&nbsp;<code>node_modules</code>&nbsp;in .gitignore) and deploy the app to Heroku:</p>
<pre class=" language-term"><code class=" language-term"><span class="token input"><span class="token prompt">$ </span>heroku create</span>
<span class="token input"><span class="token prompt">$ </span>git commit -am 'websocket starting point'</span>
<span class="token input"><span class="token prompt">$ </span>git push heroku master</span>
<span class="token input"><span class="token prompt">$ </span>heroku open</span>
</code></pre>
<h2 id="option-2-socket-io"><a href="https://devcenter.heroku.com/articles/node-websockets#option-2-socket-io">Option 2: Socket.io</a></h2>
<p>A realtime abstraction library like&nbsp;<a href="http://socket.io/">Socket.io</a>&nbsp;can help your app serve users without WebSocket support. Socket.io also provides common functionality like rooms, namespaces, and automatic reconnection. We&rsquo;ll walk through each step in setting up the app, but you can view the&nbsp;<a href="https://github.com/heroku-examples/node-socket.io">full source on GitHub</a>.</p>
<h3 id="option-2-socket-io-install-dependencies"><a href="https://devcenter.heroku.com/articles/node-websockets#option-2-socket-io-install-dependencies">Install dependencies</a></h3>
<p>This app requires a basic&nbsp;<a href="http://expressjs.com/">express</a>&nbsp;web server as well as&nbsp;<a href="http://socket.io/">socket.io</a>:</p>
<pre class=" language-term"><code class=" language-term"><span class="token input"><span class="token prompt">$ </span>npm install --save --save-exact express socket.io</span>
</code></pre>
<h3 id="option-2-socket-io-create-an-http-server"><a href="https://devcenter.heroku.com/articles/node-websockets#option-2-socket-io-create-an-http-server">Create an HTTP server</a></h3>
<p>We need an HTTP server to do two things: serve our client-side assets and provide a hook for Socket.io to monitor for socket.io-related requests.&nbsp;<a href="https://github.com/heroku-examples/node-socket.io/blob/master/server.js">The code</a>&nbsp;looks something like this:</p>
<pre class=" language-js"><code class=" language-js"><span class="token keyword">const</span> server <span class="token operator">=</span> <span class="token function">express</span><span class="token punctuation">(</span><span class="token punctuation">)</span>
  <span class="token punctuation">.</span><span class="token function">use</span><span class="token punctuation">(</span><span class="token punctuation">(</span>req<span class="token punctuation">,</span> res<span class="token punctuation">)</span> <span class="token operator">=&gt;</span> res<span class="token punctuation">.</span><span class="token function">sendFile</span><span class="token punctuation">(</span>INDEX<span class="token punctuation">)</span> <span class="token punctuation">)</span>
  <span class="token punctuation">.</span><span class="token function">listen</span><span class="token punctuation">(</span>PORT<span class="token punctuation">,</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=&gt;</span> console<span class="token punctuation">.</span><span class="token function">log</span><span class="token punctuation">(</span><span class="token template-string"><span class="token string">`Listening on </span><span class="token interpolation"><span class="token interpolation-punctuation punctuation">${</span> PORT <span class="token interpolation-punctuation punctuation">}</span></span><span class="token string">`</span></span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
</code></pre>
<h3 id="create-a-socket-io-server"><a href="https://devcenter.heroku.com/articles/node-websockets#create-a-socket-io-server">Create a Socket.io server</a></h3>
<p>The Socket.io server takes an HTTP server as an argument so that it can listen for socket.io-related requests:</p>
<pre class=" language-js"><code class=" language-js"><span class="token keyword">const</span> io <span class="token operator">=</span> <span class="token function">socketIO</span><span class="token punctuation">(</span>server<span class="token punctuation">)</span><span class="token punctuation">;</span>
</code></pre>
<h3 id="option-2-socket-io-handle-connections"><a href="https://devcenter.heroku.com/articles/node-websockets#option-2-socket-io-handle-connections">Handle connections</a></h3>
<p>We&rsquo;ll log clients connecting and disconnecting. Once a client has connected, you can also add event handlers to it to receive messages from that client.</p>
<pre class=" language-js"><code class=" language-js">io<span class="token punctuation">.</span><span class="token function">on</span><span class="token punctuation">(</span><span class="token string">'connection'</span><span class="token punctuation">,</span> <span class="token punctuation">(</span>socket<span class="token punctuation">)</span> <span class="token operator">=&gt;</span> <span class="token punctuation">{</span>
  console<span class="token punctuation">.</span><span class="token function">log</span><span class="token punctuation">(</span><span class="token string">'Client connected'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
  socket<span class="token punctuation">.</span><span class="token function">on</span><span class="token punctuation">(</span><span class="token string">'disconnect'</span><span class="token punctuation">,</span> <span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=&gt;</span> console<span class="token punctuation">.</span><span class="token function">log</span><span class="token punctuation">(</span><span class="token string">'Client disconnected'</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
</code></pre>
<h3 id="option-2-socket-io-broadcast-updates"><a href="https://devcenter.heroku.com/articles/node-websockets#option-2-socket-io-broadcast-updates">Broadcast updates</a></h3>
<p>One of the benefits of persistent socket connections is that the server can push data out to clients, without waiting for a client&rsquo;s request. In this example, we&rsquo;ll push out the current time on the server once a second:</p>
<pre class=" language-js"><code class=" language-js"><span class="token function">setInterval</span><span class="token punctuation">(</span><span class="token punctuation">(</span><span class="token punctuation">)</span> <span class="token operator">=&gt;</span> io<span class="token punctuation">.</span><span class="token function">emit</span><span class="token punctuation">(</span><span class="token string">'time'</span><span class="token punctuation">,</span> <span class="token keyword">new</span> <span class="token class-name">Date</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">.</span><span class="token function">toTimeString</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">)</span><span class="token punctuation">,</span> <span class="token number">1000</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
</code></pre>
<h3 id="create-a-socket-io-client"><a href="https://devcenter.heroku.com/articles/node-websockets#create-a-socket-io-client">Create a Socket.io client</a></h3>
<p>Our client, index.html, is a simple page that listens for time updates from the server.&nbsp;<a href="https://github.com/heroku-examples/node-socket.io/blob/master/index.html">The code</a>looks something like this:</p>
<pre class=" language-js"><code class=" language-js"><span class="token keyword">var</span> socket <span class="token operator">=</span> <span class="token function">io</span><span class="token punctuation">(</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
<span class="token keyword">var</span> el <span class="token operator">=</span> document<span class="token punctuation">.</span><span class="token function">getElementById</span><span class="token punctuation">(</span><span class="token string">'server-time'</span><span class="token punctuation">)</span><span class="token punctuation">;</span>

socket<span class="token punctuation">.</span><span class="token function">on</span><span class="token punctuation">(</span><span class="token string">'time'</span><span class="token punctuation">,</span> <span class="token keyword">function</span><span class="token punctuation">(</span>timeString<span class="token punctuation">)</span> <span class="token punctuation">{</span>
  el<span class="token punctuation">.</span>innerHTML <span class="token operator">=</span> <span class="token string">'Server time: '</span> <span class="token operator">+</span> timeString<span class="token punctuation">;</span>
<span class="token punctuation">}</span><span class="token punctuation">)</span><span class="token punctuation">;</span>
</code></pre>
<h3 id="option-2-socket-io-start-the-app"><a href="https://devcenter.heroku.com/articles/node-websockets#option-2-socket-io-start-the-app">Start the app</a></h3>
<p>You can now start and test the app locally at&nbsp;<a href="http://localhost:3000/">http://localhost:3000</a>:</p>
<pre class=" language-term"><code class=" language-term"><span class="token input"><span class="token prompt">$ </span>npm start</span>
<span class="token input"><span class="token prompt">&gt; </span>node server.js</span>

Listening on 3000
</code></pre>
<p>Once you&rsquo;re satisfied with the behavior, commit all your files to git (with&nbsp;<code>node_modules</code>&nbsp;in .gitignore) and deploy the app to Heroku.</p>
<pre class=" language-term"><code class=" language-term"><span class="token input"><span class="token prompt">$ </span>heroku create</span>
<span class="token input"><span class="token prompt">$ </span>git commit -am 'socket.io starting point'</span>
<span class="token input"><span class="token prompt">$ </span>git push heroku master</span>
<span class="token input"><span class="token prompt">$ </span>heroku open</span>
</code></pre>
<p>Apps using Socket.io should enable&nbsp;<a href="https://devcenter.heroku.com/articles/session-affinity">session affinity</a>. If you plan to use node&rsquo;s Cluster module or to scale your app to multiple dynos, you should also follow Socket.io&rsquo;s&nbsp;<a href="http://socket.io/docs/using-multiple-nodes/">multiple-nodes</a>&nbsp;instructions.</p>
<pre class=" language-term"><code class=" language-term"><span class="token input"><span class="token prompt">$ </span>heroku features:enable http-session-affinity</span></code></pre>
