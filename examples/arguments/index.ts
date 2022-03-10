import { Command } from 'commander-zod';

const command = new Command({
  name: 'arguments',
  description: 'example program arguments',
  parameters: {
    username: {
      type: 'argument',
      description: 'user to login',
    },
    password: {
      type: 'argument',
      required: false,
      description: 'password for user, if required',
      defaultValue: 'no password given',
    },
  },
}).action((props) => {
  console.log('username:', props.username);
  console.log('password:', props.password);
});

command.parse();
