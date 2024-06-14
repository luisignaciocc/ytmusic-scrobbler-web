import { Controller, Get } from '@nestjs/common';
import { AppProducer } from './app.producer';

@Controller()
export class AppController {
  constructor(private producer: AppProducer) {}

  @Get()
  getHello(): string {
    return 'Hello World!';
  }
}
