/**
 * Identification of URL access type
 * GUEST - when user id in url is 'guest'
 * ME - when user id in url is 'me'
 * ADMIN - when user id in url is 'admin'
 * USER - when user id in url is actual id
 * @type {{GUEST: string, ME: string, ADMIN: string, USER: string}}
 */
module.exports = {
  GUEST: 'guest',
  ME: 'me',
  ADMIN: 'admin',
  USER: 'user'
}
