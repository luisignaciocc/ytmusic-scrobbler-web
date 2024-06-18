dame un readme para un repositorio (en ingles)

el repositorio es un monorepo con pnpm y turborepo, consta de dos aplicaciones y la finalidad es hacer un scrobbler de lastfm que funcione con el historial de youtube music que se ejecute en un servidor y funcione para multiples usuarios. consta de una app web hecha con nextjs que se encarga de los flujos de autenticacion para obtener las keys de google y de lastfm, y una app nextjs que esta corriendo en un servidor, que corre un proceso cada 5 minutos y toma el historial de youtube y lo manda a lastfm. el proceso del background utiliza bullmq para los procesos workers. adicionalmente en el servidor de la app nestjs, se puede acceder a un dashboard para ver el estado de los procesos.

para levantar en local la app necesitamos tener pnpm instalado, tenemos un archivo docker-compose.yml que nos puede servir para levantar una base de datos postgres. necesitaremos hacer varias cosas para obtener las variables de entorno.

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
los obtenemos de crear en google cloud una aplicacion de google con ID de clientes OAuth 2.0, los permisos deben ser YouTube Data API v3 (/auth/youtube), en origenes autorizados: http://localhost:3000, en URI de redireccionamiento autorizados http://localhost:3000/api/auth/callback/google
NEXTAUTH_SECRET es un token para encryptar el json de la sesion

LAST_FM_API_KEY y LAST_FM_API_SECRET se deben obtener creando una app de lastfm, y DASHBOARD_PASSWORD es la password del usuario admin con el que se protege el /dashboard de los procesos background.

la app web corre en el puerto 3000 y el background en el 4000

una vez instalado todo se debe migrar la base de datos con pnpm migrate

para iniciar el servidor de desarrollo del front se ejecuta

pnpm dev --filter web

y para iniciar los workers se ejecuta pnpm dev --filter worker

como orm se usa prisma.

la logica de los workers es que tenemos un producer (en app.producer.ts) que envia los mensajes para que se ejecuten, cada 5 minutos, obteniendo todos los usuarios que estan activos en la base de datos, y tenemos un consumer (app.consumer.ts) que es donde esta el codigo que ejetuta el scrobbleo.

del lado del front tenemos varios botones para autorizar a google y a lastfm, tambien un poco de info del sistema.
