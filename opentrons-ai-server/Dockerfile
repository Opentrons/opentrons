FROM public.ecr.aws/lambda/python:3.12

COPY --from=public.ecr.aws/datadog/lambda-extension:57 /opt/. /opt/

WORKDIR ${LAMBDA_TASK_ROOT}

COPY requirements.txt .

RUN pip install -r requirements.txt

COPY api ${LAMBDA_TASK_ROOT}/api

CMD [ "datadog_lambda.handler.handler" ]