rm -rf $1

mkdir $1

cp ../labware/schemas/2.json $1/opentronsLabwareSchemaV2

cp ../protocol/schemas/5.json $1/opentronsProtocolSchemaV5


pipenv run datamodel-codegen --input $1  --input-file-type=jsonschema --target-python-version 3.7 --enum-field-as-literal all --use-schema-description --field-constraints  --output opentrons_shared_data/generated 
