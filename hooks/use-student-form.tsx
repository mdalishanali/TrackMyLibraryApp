import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const studentSchema = z.object({
    name: z.string().min(1),
    number: z.string().min(8),
    joiningDate: z.string().min(1),
    seat: z.string().optional(),
    shift: z.string().optional(),
    startTime: z.string().min(1),
    endTime: z.string().min(1),
    notes: z.string().optional(),
    status: z.string().optional(),
    fees: z.preprocess(val => Number(val), z.number().optional())
});

export type StudentFormValues = z.infer<typeof studentSchema>;

export function useStudentForm({ initialValues, onSubmit }) {
    const form = useForm<StudentFormValues>({
        resolver: zodResolver(studentSchema),
        defaultValues: initialValues
    });

    useEffect(() => {
        form.reset(initialValues);
    }, [initialValues]);

    const submit = form.handleSubmit(values => onSubmit(values));

    return {
        ...form,
        submit
    };
}
