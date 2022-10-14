import {
    RDSClient,
    DescribeDBClusterSnapshotsCommandInput,
    DescribeDBClusterSnapshotsCommand,
    DeleteDBClusterSnapshotCommandInput,
    DeleteDBClusterSnapshotCommand,
} from '@aws-sdk/client-rds'

export const main = async () => {
    const client = new RDSClient({ region: 'us-east-1' })

    // find all snapshots in our account
    const describeInput: DescribeDBClusterSnapshotsCommandInput = {}
    const describeCommand = new DescribeDBClusterSnapshotsCommand(describeInput)
    const snapshots = await client.send(describeCommand)

    // find snapshots older than 14 days, filter them out
    const timestamp = new Date().getTime() - 14 * 24 * 60 * 60 * 1000 // d * hr * min * s * ms
    const oldSnapshots = snapshots.DBClusterSnapshots?.filter((snapshot) => {
        if (
            snapshot.SnapshotCreateTime != undefined &&
            timestamp > snapshot.SnapshotCreateTime.getTime()
        ) {
            return snapshot
        }
    })

    // delete the older snapshots
    oldSnapshots?.forEach(async (snapshot) => {
        const deleteInput: DeleteDBClusterSnapshotCommandInput = {
            DBClusterSnapshotIdentifier: snapshot.DBClusterSnapshotIdentifier,
        }

        const deleteCommand = new DeleteDBClusterSnapshotCommand(deleteInput)
        const response = await client.send(deleteCommand)
        console.log('Deleted old snapshot: ' + response)
    })
}
