from typing import List

from openai import OpenAI
from openai.types.chat import ChatCompletion, ChatCompletionMessage, ChatCompletionMessageParam

from api.domain.prompts import system_notes
from api.settings import Settings, is_running_on_lambda

if not is_running_on_lambda():
    # we are on the local machine and want to use a development package
    # rich to pretty print the output
    from rich import print
    from rich.prompt import Prompt


class OpenAIPredict:
    def __init__(self, settings: Settings) -> None:
        self.settings: Settings = settings
        self.client: OpenAI = OpenAI(api_key=settings.openai_api_key.get_secret_value())

    def predict(self, prompt: str, chat_completion_message_params: List[ChatCompletionMessageParam] | None = None) -> None | str:
        """The simplest chat completion from the OpenAI API"""
        top_p = 0.0
        messages: List[ChatCompletionMessageParam] = [{"role": "system", "content": system_notes}]
        if chat_completion_message_params:
            messages += chat_completion_message_params

        user_message: ChatCompletionMessageParam = {"role": "user", "content": f"QUESTION/DESCRIPTION: \n{prompt}\n\n"}
        messages.append(user_message)

        response: ChatCompletion = self.client.chat.completions.create(
            model=self.settings.OPENAI_MODEL_NAME,
            messages=messages,
            stream=False,
            temperature=0.005,
            max_tokens=4000,
            top_p=top_p,
            frequency_penalty=0,
            presence_penalty=0,
        )

        assistant_message: ChatCompletionMessage = response.choices[0].message
        return assistant_message.content


def main() -> None:
    settings = Settings()
    openai = OpenAIPredict(settings)
    prompt = Prompt.ask("Type a prompt to send to the OpenAI API:")
    completion = openai.predict(prompt)
    print(completion)


if __name__ == "__main__":
    main()
