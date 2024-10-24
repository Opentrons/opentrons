'use strict'

const { DeleteObjectCommand } = require('@aws-sdk/client-s3');

/**
 * Remove an object from S3
 *
 * @param {S3Client} s3 - S3Client instance
 * @param {S3Object} obj - Object to remove
 * @param {boolean} [dryrun] - Don't actually remove anything
 * @returns {Promise} Promise that resolves when the removal is complete
 *
 * @typedef S3Object
 * @property {string} Bucket - Object bucket
 * @property {String} Prefix - Deploy folder in bucket
 * @property {string} Key - Full key to object
 */
module.exports = async function removeObject(s3, obj, dryrun) {
  console.log(
    `${dryrun ? 'DRYRUN: ' : ''}Remove\nSource: /${obj.Bucket}/${obj.Key}\n`
  );

  if (dryrun) return Promise.resolve();

  // Construct the deleteObject command with the bucket and key
  const deleteParams = { Bucket: obj.Bucket, Key: obj.Key };

  try {
    // Use the send method with DeleteObjectCommand
    const result = await s3.send(new DeleteObjectCommand(deleteParams));
    return result;
  } catch (error) {
    console.error('Error removing object:', error);
    throw error;
  }
};
