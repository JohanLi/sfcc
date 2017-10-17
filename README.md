# sfcc

This is a command line tool to ease development on Salesforce Commerce Cloud (SFCC), an e-commerce framework.
As it's a platform-as-a-service, development cannot be done locally. Another drawback is that SFCC doesn't currently
support ES6 syntax, as it uses [Rhino](http://mozilla.github.io/rhino/compat/engines.html).

This tool lets you import your cartridges from an instance, and will allow you to watch and sync local changes
to a sandbox instance.

This tool also intends to let you write ES6 syntax as well as use SASS in your SFCC projects.

## Setup

```
npm install sfcc -g
```

Create a `.env` file in the root directory of your project, containing the following variables:

```
SFCC_DOMAIN=mysandbox.demandware.net
SFCC_USERNAME=username
SFCC_PASSWORD=password
```

The username and password of a business manager account with the Administrator role (with WebDAV permissions) needs to be used.

## Commands

* **sfcc import**
* **sfcc import &lt;codeVersion&gt;**
* **sfcc watch**
* **sfcc watch &lt;codeVersion&gt;**
