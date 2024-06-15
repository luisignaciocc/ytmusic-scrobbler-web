import { BullBoardInstance, InjectBullBoard } from "@bull-board/nestjs";
import { Controller, Get } from "@nestjs/common";

@Controller()
export class AppController {
  constructor(
    @InjectBullBoard() private readonly boardInstance: BullBoardInstance,
  ) {}

  @Get()
  getHello(): string {
    return "Hello World!";
  }
}
