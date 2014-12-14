gandi-dyndns
============

If you have a computer with a dynamic ip address, and host a domain at Gandi's, you can use this small script
to update a specific dns entry with you public ip address (not unlike no-ip, dyndns, and other services).

Configuration
=============

Install the script with "npm install", and add a gandi-dns-config.json either in your home folder, or in the
current directory.

The configuration file has the following form:

  [
    {
      "api-key": "XXXXXXXX",
      "record": "my.record.domain.tld"
    }
  ]

See the provided sample in the project folder.
