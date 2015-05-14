# Launchchimp

[![Deploy](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy)

Launchchimp provides a simple polling service to integrate your list of users that have
signed up on Launchrock and a Mailchimp list you might be using.

## Instructions

Launchchimp is designed to be run either as a background daemon, a foreground process,
or deployed to Heroku and run via `npm start`. To begin, ensure you have created an API Key
in Mailchimp, as well as a list.

Launchchimp relies upon the following configuration variables to be present:
```
LAUNCHCHIMP_LR_EMAIL        <---- Email address to login to Launchrock (required)
LAUNCHCHIMP_LR_PASSWORD     <---- Password used to login to Launchrock (required)
LAUNCHCHIMP_LR_PROJECT      <---- Name of the project in Launchrock (required)
LAUNCHCHIMP_MC_ADMINS       <---- Comma separated list of emails to send a success email to (optional)
LAUNCHCHIMP_MC_API_KEY      <---- Your Mailchimp API key (required)
LAUNCHCHIMP_MC_LIST         <---- Name of the Mailchimp list to add subscribers to (required)
LAUNCHCHIMP_POLL_FREQUENCY  <---- How frequently to poll for new users (defaults to 10min)
```

If deploying to Heroku, ensure you've set your configuration correctly.

Assuming your config is set either in your environment or specified as a variable
in the terminal, you can run the service either by running `bin/launchchimp-daemon`,
`npm start`, or by scaling 'worker' dynos on Heroku.

## Contributing to Launchchimp

* Check out the latest master to make sure the feature hasn't been implemented or the bug hasn't been fixed yet
* Check out the issue tracker to make sure someone already hasn't requested it and/or contributed it
* Fork the project
* Start a feature/bugfix branch
* Commit and push until you are happy with your contribution
* Make sure to add tests for it. This is important so I don't break it in a future version unintentionally.
* Please try not to mess with the Rakefile, version, or history. If you want to have your own version, or is otherwise necessary, that is fine, but please isolate to its own commit so I can cherry-pick around it.

## Copyright

Copyright (c) 2015 Tim Olshansky.
